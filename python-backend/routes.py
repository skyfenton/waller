from fastapi import FastAPI, APIRouter, Request, HTTPException, UploadFile

# Async processing
import aiofiles

# Local files
import db
import processing

router = APIRouter()


@router.get("/")
async def root():
    return {"message": "Hello World, I am listening."}


async def save_file(file, path):
    file.file.seek(0)
    async with aiofiles.open(path, "wb") as out_file:
        while content := await file.read(1024):  # async read chunk
            await out_file.write(content)  # async write chunk


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


@router.post("/jobs", status_code=201)
async def upload_image(file: UploadFile, request: Request) -> dict:
    """
    POST request endpoint to save an uploaded image and queue it for
    segmentation. File is saved in the 'queued' folder under the data folder
    specified by the DATA_PATH environment variable '##.jpeg/jpg/png' where ##
    is the generated server-side id associated to the image. If successful,
    responds with a 201 Created status code.

    Note, this loads the file into a memory/disk buffer which can be overloaded
    with many requests. Can be mitigated by handling as a custom stream,
    however, I don't care (jk, just not worth adding complexity when I'm the
    only one using this service). See:
    https://fastapi.tiangolo.com/tutorial/request-files/#file-parameters-with-uploadfile

    Question... Do multipart form data requests time out if it takes too long?

    Args:
        file (UploadFile): Multipart file to run image segmentation inference
        on, which must be a jpeg, jpg, or png image under 2MB.
        request (Request): Request object used to get model_loop queue.

    Raises:
        HTTPException: 400 code if file over 2MB
        HTTPException: 400 if file not jpeg, jpg, or png

    Returns:
        dict: JSON body response with the newly generated unique job id

    Todo:
        * Return error if can't put item in queue (may have issue if maximum
        amount of items in queue is specified)
    """

    file.file.seek(0, 2)
    file_size = file.file.tell()

    if file_size > 2 * 1024 * 1024:
        # more than 2 MB
        raise HTTPException(status_code=400, detail="File too large")

    # check the content type (MIME type)
    content_type = file.content_type
    if content_type not in ["image/jpeg", "image/jpg", "image/png"]:
        raise HTTPException(status_code=400, detail="Invalid file type")

    # Create new row for job (new job's StatusID: 0 - "uploading")
    id = db.exec_queries(
        "INSERT INTO Jobs DEFAULT VALUES",
        "SELECT last_insert_rowid()",
    )[0]

    save_path = f"data/queued/{id}.{content_type.rsplit("/", 1)[1]}"
    await save_file(file, save_path)
    await queue_job(request.app, processing.JobItem(id, save_path))

    return {"id": id}


@router.get("/jobs/{id}", status_code=200)
async def get_data(id: int) -> dict:
    """
    GET endpoint for getting status of given id in status database (img_status).
    Responds with 200 OK if successful.

    Args:
        id (int): ID of job to query.

    Raises:
        HTTPException: 404: { "Item not found" } if id not found in database.

    Returns:
        dict: JSON response with status of item.
    """

    res = db.exec_query(
        f"""SELECT Statuses.Desc
            FROM Jobs JOIN Statuses USING (StatusID) 
            WHERE Jobs.JobID = {id}"""
    )
    if not res:
        raise HTTPException(404, "Item not found")
    return {"status": res[0]}


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
