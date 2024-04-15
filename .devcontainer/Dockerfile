FROM mcr.microsoft.com/devcontainers/python:1-3.12-bullseye

COPY requirements.txt .

RUN --mount=type=cache,target=/root/.cache \
    pip install -r requirements.txt