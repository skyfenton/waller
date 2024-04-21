from fastapi import FastAPI, HTTPException, UploadFile
from dataclasses import dataclass

from contextlib import asynccontextmanager
import multiprocessing as mp

import sqlite3

import time
import random
import waller_lib as waller

@dataclass
class ProcessImageItem:
  id: str
  image: bytes

id_db={}

def get_free_id() -> str:
  while True:
    id = str(random.randint(0, 99999))
    if id not in id_db:
      return id

# Computationally Intensive Task
def cpu_bound_task(item: ProcessImageItem):
    print(f"Processing: {item.id}")
    for i in range(15):
      print(i, end=" ", flush=True)
      time.sleep(1)
    return 'ok'

def model_loop(request_q: mp.Queue):
    # model = waller.WallerProcess()
    while True:
        # wait until request in queue
        queue_item: ProcessImageItem = request_q.get(block=True)
        
        # loop = asyncio.get_running_loop()
        # do the thing
        # NOTE this "await" blocks the loop, so another image in queue will not be processed until this finishes
        # res = await loop.run_in_executor(pool, model.process_image, queue_item.image)
        # p = mp.Process(target=run_and_queue, args=[model.process_image, queue_item.image, response_q], daemon=True)
        cpu_bound_task(queue_item)
        
        # TODO multiprocessing to avoid blocking thread
        # cpu_bound_task(queue_item)
        # model.process_image(queue_item.image)
        
        # update db with url when successful
        # TODO add check if processing unsuccessful (res is invalid)
        
        # tell the queue that the process has been created
        # q.task_done()


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
  # TODO add file content type check for images
  uri = get_free_id()
  
  # pass content to queue
  # NOTE this loads file content into memory, can get overloaded
  # TODO save file locally while waiting to be processed in queue
  image = await file.read()
  # TODO return error if can't put item in queue
  app.q.put_nowait(ProcessImageItem(uri, image))
  
  # TODO move db actions to external db class
  id_db[uri] = "queued"
  
  # return file_id
  return {"id" : uri}
  
'''
Retrieves processed image status with this id, or if does not exist or still processing, a corresponding status code.
'''
@app.get("/{id}", status_code=200)
async def get_data(id):
  if id not in id_db:
    raise HTTPException(404, "Item not found")
  return {"status": id_db[id]}
  
@app.delete("/{id}", status_code=200)
async def delete_data(id):
  # TODO implement
  raise HTTPException(501)
  # return "unimplemented"

if __name__ == '__main__':
  import uvicorn
  uvicorn.run(app)