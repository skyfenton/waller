"""
Script to run local http server with routes to create, remove, and read image
segmentation jobs.
"""

# API framework
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Async processing
import multiprocessing as mp
from contextlib import asynccontextmanager

# Local files
import processing
import routes
import db
import time

# TODO replace with env variable
ORIGINS = ["http://localhost:5173"]

def create_lifespan(queue_handler):
    """
    Factory to create a lifespan handler for child processes and assign a
    queue for process jobs to app.
    """
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        request_q = mp.Queue()
        loop = mp.Process(target=queue_handler, args=[request_q], daemon=True)
        loop.start()

        app.q = request_q
        yield
        # kill model queue when app is closed
        loop.kill()
    return lifespan


def dummy_loop(request_q: mp.Queue):
    """
    Loop to simulate doing work in a separate process on queued jobs.
    """
    print("--- Running dummy loop ---")
    while True:
        # wait until request in queue
        job: processing.JobItem = request_q.get(block=True)

        db.exec_query(
            f"""UPDATE Jobs
                SET StatusID = 2
                WHERE JobID = {job.id}"""
        )

        # do the thing
        time.sleep(10)

        # TODO add check if processing unsuccessful (res is invalid)
        db.exec_query(
            f"""UPDATE Jobs
                SET StatusID = 3
                WHERE JobID = {job.id}"""
        )

    

def create_app(multiprocess='model') -> FastAPI:
    """
    Wrapper to create FastAPI app with middleware and routes
    Args:
        multiprocess (str, optional): If 'model' (default), app runs lifespan
        function to manage processing.model_loop() in a new process. If 'dummy',
        lifespan will create a process to run a function to wait instead of
        using model_loop. If neither, will not use a lifespan function or create
        a new process (ONLY USE THIS OPTION FOR TESTING OR QUEUE WILL BREAK).

    Returns:
        FastAPI: FastAPI app object
        
    Todo:
        * Define multiprocess as some kind of enum to limit multiprocessing
          'modes'. Should let user know when they call function with a malformed
          argument.
    """

    match multiprocess:
        case 'model':
            lifespan = create_lifespan(processing.model_loop)
        case 'dummy':
            lifespan = create_lifespan(dummy_loop)
        case _:
            lifespan = None
    
    app = FastAPI(lifespan=lifespan) 
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ORIGINS,
        # allow_credentials=True,
        allow_methods=["GET", "POST", "DELETE"],
        allow_headers=["*"],
    )
    app.include_router(routes.router)
    return app
