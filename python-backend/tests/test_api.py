import io
from unittest import mock

import pytest
from PIL import Image

import db
import main
import app as WallerAPI
from fastapi.testclient import TestClient


def make_png_bytes() -> bytes:
    """Create a minimal valid PNG image for upload tests."""
    buffer = io.BytesIO()
    Image.new("RGB", (1, 1), (255, 0, 0)).save(buffer, format="PNG")
    return buffer.getvalue()


@pytest.fixture()
def test_client():
    main.reset_storage()
    with TestClient(WallerAPI.create_app(multiprocess='none')) as client:
        yield client  # testing happens here


def test_upload_file_too_large(test_client):
    mock_file = bytes(2 * 1024 * 1024 + 1)
    res = test_client.post("/jobs", files={"file": ("test.png", mock_file)})
    assert res.status_code == 413
    assert res.json() == {"detail": "File too large"}


def test_upload_invalid_type(test_client):
    mock_file = bytes(42)
    res = test_client.post("/jobs", files={"file": ("test.gif", mock_file)})
    assert res.status_code == 415
    assert res.json() == {"detail": "Invalid file type"}


def test_upload_invalid_image_content(test_client):
    # Content type claims PNG, but the bytes are not a real image
    mock_file = bytes(42)
    res = test_client.post("/jobs", files={"file": ("test.png", mock_file)})
    assert res.status_code == 400
    assert res.json() == {"detail": "Invalid image file"}


@mock.patch("routes.queue_job")
@mock.patch("routes.save_file")
def test_upload_success(
    save_file: mock.AsyncMock, queue_job: mock.AsyncMock, test_client
):
    mock_file = make_png_bytes()
    res = test_client.post("/jobs", files={"file": ("test.png", mock_file)})
    save_file.assert_awaited_once()
    # Server-generated name uses the id and canonical extension
    save_path = save_file.await_args.args[1]
    assert save_path.name == "1.png"
    queue_job.assert_awaited_once()
    assert res.status_code == 201
    assert res.json() == {"id": 1}


def test_get_done_job_returns_mask_url(test_client):
    db.exec_query("INSERT INTO Jobs (StatusID) VALUES (3)")
    res = test_client.get("/jobs/1")
    assert res.status_code == 200
    assert res.json() == {
        "status": "done",
        "maskURL": "http://testserver/images/1.png",
    }


def test_get_job_in_progress_has_no_mask_url(test_client):
    db.exec_query("INSERT INTO Jobs (StatusID) VALUES (1)")
    res = test_client.get("/jobs/1")
    assert res.status_code == 200
    assert res.json() == {"status": "queued"}


def test_get_unknown_job(test_client):
    res = test_client.get("/jobs/999")
    assert res.status_code == 404
    assert res.json() == {"detail": "Item not found"}
