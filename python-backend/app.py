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

# TODO replace with env variable
ORIGINS = ["http://localhost:5173"]


def create_app(multiprocess: bool = True) -> FastAPI:
    """
    Wrapper to create FastAPI app with middleware and routes
    Args:
        multiprocess (bool, optional): If True, app runs lifespan function to
        manage processing.model_loop() in a new process. Defaults to True
        (should be set to False for testing).

    Returns:
        FastAPI: FastAPI app object
    """

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        request_q = mp.Queue()
        loop = mp.Process(target=processing.model_loop, args=[request_q], daemon=True)
        loop.start()

        app.q = request_q
        yield
        # kill model queue when app is closed
        loop.kill()
    
    if not multiprocess:
        app = FastAPI()
    else:
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
