"""
Main script, run to initialize app
"""

# pip dependencies
import uvicorn
from dotenv import dotenv_values

# Local files
from app import create_app
import db

# TODO add CLI with click package

db.teardown()
db.setup()

app = create_app()
uvicorn.run(
    app, host=dotenv_values().get("HOST"), port=int(dotenv_values().get("PORT"))
)
