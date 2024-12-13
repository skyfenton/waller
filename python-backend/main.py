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

@click.group(invoke_without_command=True)
@click.pass_context
def cli(ctx):
    if ctx.invoked_subcommand is None:
        ctx.invoke(start_app)

@cli.command()
# @click.option('--dummy', is_flag=True, help="Replaces the image segmentation model with a 10 second wait to simulate work.")
def start_app ( dummy=False ):
    reset_storage()
    uvicorn.run(
        create_app('dummy' if dummy else 'model'), host=dotenv_values().get("HOST"), port=int(dotenv_values().get("PORT"))
    )

# @cli.command()
# def test_model():
#     import waller_lib as waller
    
#     model = waller.WallerProcess()
#     while True:
#         try:
#             path = input("Enter path to image: ")
#             output_path = os.path.join(
#                 "tmp",
#                 os.path.splitext(os.path.basename(path))[0] + ".png"
#             )
#             model.process_image(path, output_path)
#         except FileNotFoundError:
#             print(f"Error: File '{path}' not found.")
    

if __name__ == "__main__":
    cli()