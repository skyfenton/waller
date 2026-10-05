# API framework
from fastapi import (
    APIRouter,
    FastAPI,
    File,
    HTTPException,
    Request,
    UploadFile,
    status,
)
from pydantic import BaseModel

# Async processing
import aiofiles

# Standard library
from pathlib import Path
from typing import Annotated

# Third party
from PIL import Image

# Local files
import db
import processing

router = APIRouter()

QUEUED_DIR = Path("data/queued")
MAX_UPLOAD_BYTES = 2 * 1024 * 1024  # 2 MB
UPLOAD_CHUNK_SIZE = 64 * 1024  # 64 KB

# Accepted upload MIME types mapped to their canonical file extension
ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
}


@router.get("/")
async def root():
    return {"message": "Hello World, I am listening."}


async def save_file(file: UploadFile, path: Path) -> int:
    """
    Stream an uploaded file to disk in chunks.

    Aborts and removes the partial file if the upload exceeds
    MAX_UPLOAD_BYTES, so oversized uploads never fully land on disk.

    Args:
        file (UploadFile): File to write to disk.
        path (Path): Destination file path.

    Returns:
        int: Number of bytes written.

    Raises:
        HTTPException: 413 code if file over MAX_UPLOAD_BYTES.
    """
    await file.seek(0)
    written = 0
    try:
        async with aiofiles.open(path, "wb") as out_file:
            while chunk := await file.read(UPLOAD_CHUNK_SIZE):
                written += len(chunk)
                if written > MAX_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                        detail="File too large",
                    )
                await out_file.write(chunk)
    except BaseException:
        path.unlink(missing_ok=True)
        raise
    return written


def verify_image(file: UploadFile) -> None:
    """
    Verify that an upload is a real image Pillow can decode, catching
    spoofed MIME types (e.g. a text file sent as image/png).

    Args:
        file (UploadFile): File to verify, positioned at the start.

    Raises:
        HTTPException: 400 if the file is not a valid image.
    """
    try:
        with Image.open(file.file) as image:
            image.verify()
    except (OSError, SyntaxError, Image.DecompressionBombError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image file",
        ) from exc


async def queue_job(app: FastAPI, job: processing.JobItem):
    """
    Queue job for processing in given app

    Args:
        app (FastAPI): FastAPI app with multiprocessing queue attribute - 'q'.
        job (processing.JobItem): JobItem object to queue.

    Todo:
        * Refactor FastAPI object to strictly define 'q' attribute. Right now, q
          gets defined in lifespan, but app does not run lifespan during
          testing, so testing upload_image throws AttributeError. Moved the
          app.q access here to avoid this (since this function should be mocked
          during testing), but not ideal solution.

    """

    app.q.put_nowait(job)
    db.exec_query(
        f""" UPDATE Jobs
            SET StatusID = 1
            WHERE JobID = {job.id}"""
    )


class JobCreated(BaseModel):
    """Response body for a newly created segmentation job."""

    id: int


@router.post("/jobs", status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: Annotated[UploadFile, File(description="JPEG or PNG image up to 2 MB")],
    request: Request,
) -> JobCreated:
    """
    POST request endpoint to save an uploaded image and queue it for
    segmentation. The file is streamed to the 'queued' folder under the data
    folder as '##.jpg/png' where ## is the generated server-side id associated
    to the image. If successful, responds with a 201 Created status code.

    Uploads are accepted as multipart/form-data with the file in the 'file'
    field. Starlette buffers the upload (spooling to disk above a size
    threshold), so many concurrent large requests can still consume
    memory/disk. See:
    https://fastapi.tiangolo.com/tutorial/request-files/#file-parameters-with-uploadfile

    Args:
        file (UploadFile): Multipart file to run image segmentation inference
        on, which must be a jpeg, jpg, or png image under 2MB.
        request (Request): Request object used to get model_loop queue.

    Raises:
        HTTPException: 413 code if file over 2MB
        HTTPException: 415 if file not jpeg, jpg, or png
        HTTPException: 400 if file content is not a decodable image

    Returns:
        JobCreated: JSON body response with the newly generated unique job id
    """

    # Reject oversized uploads before doing any other work
    if file.size is not None and file.size > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="File too large",
        )

    # Check the content type (MIME type)
    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Invalid file type",
        )

    # Check the actual file content before writing anything to disk
    await file.seek(0)
    verify_image(file)

    # Create new row for job (new job's StatusID: 0 - "uploading")
    id = db.exec_queries(
        "INSERT INTO Jobs DEFAULT VALUES",
        "SELECT last_insert_rowid()",
    )[0]

    # Server-generated name only; never trust the client filename
    save_path = QUEUED_DIR / f"{id}{ALLOWED_IMAGE_TYPES[content_type]}"

    try:
        await save_file(file, save_path)
        await queue_job(request.app, processing.JobItem(id, str(save_path)))
    except Exception:
        # Don't leave orphaned rows or files behind on failure
        save_path.unlink(missing_ok=True)
        db.exec_query(f"DELETE FROM Jobs WHERE JobID = {id}")
        raise

    return JobCreated(id=id)


@router.get("/jobs/{id}", status_code=200)
async def get_data(id: int, request: Request) -> dict:
    """
    GET endpoint for getting status of given id in status database (img_status).
    Responds with 200 OK if successful. Once processing is done, the response
    also includes the URL of the generated mask image.

    Args:
        id (int): ID of job to query.
        request (Request): Request object used to build the mask URL.

    Raises:
        HTTPException: 404: { "Item not found" } if id not found in database.

    Returns:
        dict: JSON response with status of item, plus 'maskURL' when done.
    """

    res = db.exec_query(
        f"""SELECT Statuses.Desc
            FROM Jobs JOIN Statuses USING (StatusID) 
            WHERE Jobs.JobID = {id}"""
    )
    if not res:
        raise HTTPException(404, "Item not found")

    status_desc = res[0]
    body = {"status": status_desc}
    if status_desc == "done":
        body["maskURL"] = str(request.url_for("images", path=f"{id}.png"))
    return body


@router.delete("/jobs/{id}", status_code=200)
async def delete_data(id: int):
    """
    DELETE endpoint for removing job and its related resources. Responds with
    200 OK if successful.

    Args:
        id (int): ID of job/image to delete.

    Raises:
        HTTPException: 404: { "Item not found" } if id not found in database.
    """
    # TODO implement
    raise HTTPException(501)
    # return "unimplemented"
