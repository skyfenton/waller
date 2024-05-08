# load environment variables
from dotenv import load_dotenv
load_dotenv()

# REST API 
from fastapi import FastAPI, HTTPException, UploadFile
from dataclasses import dataclass

# Async processing
from contextlib import asynccontextmanager
import aiofiles
import multiprocessing as mp

# Local files 
import waller_lib as waller
import db_utils as db


@dataclass
class ProcessImageItem:
  id: str
  path: str


def model_loop(request_q: mp.Queue):
    model = waller.WallerProcess()
    print("Model loaded")
    while True:
        # wait until request in queue
        job_item: ProcessImageItem = request_q.get(block=True)

        db.exec_query(
          f'UPDATE img_status\
            SET status = "processing"\
            WHERE id = {job_item.id}')
        
        # do the thing
        # cpu_bound_task(queue_item)
        model.process_image(job_item.path, f"data/processed/{job_item.id}.png")
        
        # TODO add check if processing unsuccessful (res is invalid)
        db.exec_query(
          f'UPDATE img_status\
            SET status = "done"\
            WHERE id = {job_item.id}')


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


'''
Queues image for processing and returns "200" with a unique item id, if possible. When successful, the client should show a placeholder loading screen and periodically send GET requests to check if the image has been processed.
'''
@app.post("/upload", status_code=200)
async def queue_image(file: UploadFile):
  # TODO add type check for file type = images
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
    'SELECT last_insert_rowid()'
    )[0]
    
  # save uploaded file asynchronously as "id##.jpeg/png/etc"
  out_file_path = f"data/queued/{id}.{content_type.rsplit("/", 1)[1]}"
  file.file.seek(0)
  async with aiofiles.open(out_file_path, 'wb') as out_file:
    while content := await file.read(1024):  # async read chunk
        await out_file.write(content)  # async write chunk
  
  # TODO return error if can't put item in queue
  app.q.put_nowait(ProcessImageItem(id, out_file_path))
  
  # return file_id
  return {"id" : id}


'''
Retrieves image status with this id, or if id does not exist, 404 exception.
'''
@app.get("/{id}", status_code=200)
async def get_data(id):
  res = db.exec_query(f'SELECT status FROM img_status WHERE id = {id}')
  if not res:
    raise HTTPException(404, "Item not found")
  return {"status" : res[0]}


@app.delete("/{id}", status_code=200)
async def delete_data(id):
  # TODO implement
  raise HTTPException(501)
  # return "unimplemented"


if __name__ == '__main__':
  # TODO add arg parser to let user skip db setup,
  # run stall instead of model, localhost
  # import argparse
  # parser = argparse.ArgumentParser(description='Run API webserver for processing requests.')
  # parser.add_argument('--clean', )
  db.teardown()
  db.setup()
  
  import os
  import uvicorn
  uvicorn.run(app, host=os.getenv('HOST'), port=int(os.getenv('PORT')))
  # uvicorn.run("api:app", reload=True)