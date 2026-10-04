"""
Main script, run to initialize app
"""

# pip dependencies
import os
import shutil

import click
import db
import uvicorn

# Local files
from app import create_app
from dotenv import dotenv_values


def reset_storage():
    shutil.rmtree("data", ignore_errors=True)
    os.makedirs("data/processed")
    os.makedirs("data/queued")

    db.teardown()
    db.setup()

@click.group(invoke_without_command=True)
@click.option('--reload', is_flag=True, help="Restart the server when source files change")
@click.pass_context
def cli(ctx, reload=False):
    if ctx.invoked_subcommand is None:
        ctx.invoke(start_app, reload=reload)

def create_app_from_env():
    """
    App factory for uvicorn's reload mode, which requires the app as an import
    string instead of an app instance.
    """
    return create_app(os.environ.get("WALLER_PROCESS_MODE", "model"))

@cli.command()
# @click.option('--dummy', is_flag=True, help="Replaces the image segmentation model with a 10 second wait to simulate work.")
def start_app ( dummy=False, reload=False ):
    reset_storage()
    host = dotenv_values().get("HOST")
    port = int(dotenv_values().get("PORT"))

    if reload:
        os.environ["WALLER_PROCESS_MODE"] = 'dummy' if dummy else 'model'
        project_dir = os.path.dirname(os.path.abspath(__file__))
        uvicorn.run(
            "main:create_app_from_env",
            factory=True,
            host=host,
            port=port,
            reload=True,
            reload_dirs=[project_dir],
            reload_excludes=[
                os.path.join(project_dir, ".venv"),
                os.path.join(project_dir, "data"),
            ],
        )
    else:
        uvicorn.run(create_app('dummy' if dummy else 'model'), host=host, port=port)

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
