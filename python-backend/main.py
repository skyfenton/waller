"""
Main script, run to initialize app
"""

# pip dependencies
import uvicorn
from dotenv import dotenv_values
import click

# Local files
from app import create_app
import db

import shutil
import os


def reset_storage():
    shutil.rmtree("data", ignore_errors=True)
    os.makedirs("data/processed")
    os.makedirs("data/queued")

    db.teardown()
    db.setup()


@click.command
@click.option('--dummy', is_flag=True, help="Replaces the image segmentation model with a 10 second wait to simulate work.")
def start_app ( dummy: bool ):
    reset_storage()
    uvicorn.run(
        create_app('dummy' if dummy else 'model'), host=dotenv_values().get("HOST"), port=int(dotenv_values().get("PORT"))
    )
    

if __name__ == "__main__":
    start_app()