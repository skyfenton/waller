"""
Main script, run to initialize app
"""

# pip dependencies
import uvicorn
from dotenv import dotenv_values

# Local files
from api import app
import db

# TODO add CLI with click

db.teardown()
db.setup()

uvicorn.run(
    app, host=dotenv_values().get("HOST"), port=int(dotenv_values().get("PORT"))
)
