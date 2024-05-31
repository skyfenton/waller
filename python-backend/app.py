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


ORIGINS = ["http://localhost", "http://127.0.0.1"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    request_q = mp.Queue()
    loop = mp.Process(target=processing.model_loop, args=[request_q], daemon=True)
    loop.start()

    app.q = request_q
    yield
    # kill model queue when app is closed
    loop.kill()


def create_app() -> CORSMiddleware:
    """Create app wrapper to overcome middleware issues."""
    app = FastAPI(lifespan=lifespan)
    app.include_router(routes.router)
    return CORSMiddleware(
        app,
        allow_origins=ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
