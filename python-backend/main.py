"""
Entry point loaded by the FastAPI CLI (`fastapi dev` / `fastapi run`).

From the python-backend directory:
    mise serve                    # start the API and model worker
    mise watch serve --restart    # restart on source changes

Set WALLER_PROCESS_MODE=dummy to run the simulated worker instead of the
segmentation model.
"""

# Standard library
import os
import shutil

# Local files
import db
from app import create_app

app = create_app(os.environ.get("WALLER_PROCESS_MODE", "model"))


def reset_storage():
    """
    Reset local storage to a clean state. Used by the test suite.

    WARNING: deletes everything under the local 'data' directory.
    """
    shutil.rmtree("data", ignore_errors=True)
    os.makedirs("data/processed")
    os.makedirs("data/queued")

    db.teardown()
    db.setup()
