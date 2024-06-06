"""
Main script, run to initialize app
"""

# pip dependencies
import uvicorn
from dotenv import dotenv_values

# Local files
from app import create_app
import db

import shutil
import os

# TODO add CLI with click package

def reset_storage():
    shutil.rmtree("data", ignore_errors=True)
    os.makedirs("data/processed")
    os.makedirs("data/queued")

    db.teardown()
    db.setup()

if __name__ == "__main__":
    reset_storage()
    uvicorn.run(
        create_app(), host=dotenv_values().get("HOST"), port=int(dotenv_values().get("PORT"))
    )
