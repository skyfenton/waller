from fastapi import FastAPI, HTTPException, UploadFile
from dataclasses import dataclass

from contextlib import asynccontextmanager
import multiprocessing as mp
import time

import db_utils as db


@dataclass
class ProcessImageItem:
  id: str
  image: bytes


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

        db.exec_query(
          f'UPDATE img_status\
            SET status = "processing"\
            WHERE id = {queue_item.id}')
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
        db.exec_query(
          f'UPDATE img_status\
            SET status = "done"\
            WHERE id = {queue_item.id}')
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
  # TODO add type check for file type = images
  
  # pass content to queue
  # NOTE this loads file content into memory, can get overloaded
  # TODO save file locally while waiting to be processed in queue
  image = await file.read()
  # TODO move db actions to external db class
  db.exec_query('INSERT INTO img_status (status) VALUES ("queued")')
  id = db.exec_query('SELECT * FROM img_status ORDER BY id DESC LIMIT 1')[0][0]
  
  # TODO return error if can't put item in queue
  app.q.put_nowait(ProcessImageItem(id, image))
  
  # return file_id
  return {"id" : id}
  
'''
Retrieves processed image status with this id, or if does not exist or still processing, a corresponding status code.
'''
@app.get("/{id}", status_code=200)
async def get_data(id):
  res = db.exec_query(f'SELECT * FROM img_status WHERE id = {id}')
  if not res:
    raise HTTPException(404, "Item not found")
  return {"status" : res[0][1]}
  
@app.delete("/{id}", status_code=200)
async def delete_data(id):
  # TODO implement
  raise HTTPException(501)
  # return "unimplemented"

if __name__ == '__main__':
  # TODO add arg parser to let user skip db setup
  # import argparse
  # parser = argparse.ArgumentParser(description='Run API webserver for processing requests.')
  # parser.add_argument('--clean', )
  db.teardown()
  db.setup()
  
  import uvicorn
  uvicorn.run(app)