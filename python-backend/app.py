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


ORIGINS = ["http://localhost:5173"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    request_q = mp.Queue()
    loop = mp.Process(target=processing.model_loop, args=[request_q], daemon=True)
    loop.start()

    app.q = request_q
    yield
    # kill model queue when app is closed
    loop.kill()


def create_app() -> FastAPI:
    """Create app wrapper to overcome middleware issues."""
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
