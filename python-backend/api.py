from fastapi import FastAPI, HTTPException, UploadFile

from dataclasses import dataclass

from concurrent.futures import ProcessPoolExecutor
from contextlib import asynccontextmanager
import asyncio

import time
import random
import waller_lib as waller

@dataclass
class ProcessImageItem:
  id: str
  image: bytes

id_db = {}

def get_free_id() -> str:
  while True:
    id = str(random.randint(0, 99999))
    if id not in id_db:
      return id

# Computationally Intensive Task
def cpu_bound_task(item: ProcessImageItem):
    print(f"Processing: {item.id}")
    time.sleep(15)
    return 'ok'

async def model_loop(q: asyncio.Queue, pool: ProcessPoolExecutor):
    model = waller.WallerProcess()
    while True:
        # wait until request in queue
        queue_item: ProcessImageItem = await q.get()
        id_db[queue_item.id] = "processing"
        
        loop = asyncio.get_running_loop()
        # do the thing on another core
        # NOTE this "await" blocks the loop, so another image in queue will not be processed until this finishes
        res = await loop.run_in_executor(pool, cpu_bound_task, queue_item)
        
        # update db with url when successful
        # TODO add check if processing unsuccessful (res is invalid)
        id_db[queue_item.id] = res
        
        # tell the queue that the processing on the task is completed
        q.task_done()


@asynccontextmanager
async def lifespan(app: FastAPI):
    q = asyncio.Queue()  # note that asyncio.Queue() is not thread safe
    pool = ProcessPoolExecutor()
    asyncio.create_task(model_loop(q, pool)) # Start the requests processing task
    app.q = q
    yield
    pool.shutdown()  
    # free any resources that the pool is using when the currently pending futures are done executing


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