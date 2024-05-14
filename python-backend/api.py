"""
Script to run local http server with routes to create, remove, and read image
segmentation jobs.
"""
# API framework
from fastapi import FastAPI, HTTPException, UploadFile
from dataclasses import dataclass

# Async processing
import multiprocessing as mp
from contextlib import asynccontextmanager
import aiofiles

# Local files
import waller_lib as waller
import db


@dataclass
class ProcessJobItem:
    """
    Dataclass for queuing segmentation jobs by bundling ids with save_path.

    Attributes:
        id (str): ID of job.
        src_path (str): Path to source image on disk. Included since although
        img name is its id, the extension may either be .jpg or .png, and it was
        slightly easier to store src path rather than just extension.

    Todo:
        * Refactor ids from str to ints
        * Refactor src_path to just specify file type
        * Move job queue from memory to disk to decrease memory usage and
        increase queue storage (non-urgent, shouldn't have enough jobs
        queued to make impact on performance).
    """

    id: str
    src_path: str


def model_loop(request_q: mp.Queue):
    model = waller.WallerProcess()
    print("Model loaded")
    while True:
        # wait until request in queue
        job_item: ProcessJobItem = request_q.get(block=True)

        db.exec_query(
            f'UPDATE img_status\
            SET status = "processing"\
            WHERE id = {job_item.id}'
        )

        # do the thing
        # cpu_bound_task(queue_item)
        model.process_image(job_item.src_path, f"data/processed/{job_item.id}.png")

        # TODO add check if processing unsuccessful (res is invalid)
        db.exec_query(
            f'UPDATE img_status\
            SET status = "done"\
            WHERE id = {job_item.id}'
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    request_q = mp.Queue()
    loop = mp.Process(target=model_loop, args=[request_q], daemon=True)
    loop.start()

    app.q = request_q
    yield
    loop.kill()


app = FastAPI(lifespan=lifespan)


@app.get("/")
async def root():
    return {"message": "Hello World, I am listening."}


@app.post("/upload", status_code=200)
async def queue_image(file: UploadFile) -> dict:
    """
    POST request endpoint to save an uploaded image and queue it for
    segmentation. File is saved in the 'queued' folder under the data folder
    specified by the DATA_PATH environment variable '##.jpeg/png' where ## is
    the generated server-side id associated to the image. If successful,
    responds with a 200 OK status code.

    Args:
        file (UploadFile): Multipart file to run image segmentation inference
        on, which must be a jpeg/png image under 2MB.

    Raises:
        HTTPException: 400 code if file over 2MB
        HTTPException: 400 if file not jpeg or png

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
    if content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Invalid file type")

    id = db.exec_queries(
        'INSERT INTO img_status (status) VALUES ("queued")',
        "SELECT last_insert_rowid()",
    )[0]

    save_path = f"data/queued/{id}.{content_type.rsplit("/", 1)[1]}"
    file.file.seek(0)
    async with aiofiles.open(save_path, "wb") as out_file:
        while content := await file.read(1024):  # async read chunk
            await out_file.write(content)  # async write chunk

    app.q.put_nowait(ProcessJobItem(id, save_path))

    return {"id": id}


@app.get("/{id}", status_code=200)
async def get_data(id: int) -> dict:
    """
    GET endpoint for getting status of given id in status database (img_status).
    Responds with 200 OK if successful.

    Args:
        id (int): Id of job to query.

    Raises:
        HTTPException: 404: { "Item not found" } if id not found in database.

    Returns:
        dict: JSON response with status of item.
    """

    res = db.exec_query(f"SELECT status FROM img_status WHERE id = {id}")
    if not res:
        raise HTTPException(404, "Item not found")
    return {"status": res[0]}


@app.delete("/{id}", status_code=200)
async def delete_data(id: int):
    """
    DELETE endpoint for removing images from storage. Responds with 200 OK if
    successful.

    Args:
        id (int): ID of job/image to delete.

    Raises:
        HTTPException: 404: { "Item not found" } if id not found in database.
    """
    # TODO implement
    raise HTTPException(501)
    # return "unimplemented"