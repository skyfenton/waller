from unittest import mock
import pytest
import main
import app as WallerAPI
from fastapi.testclient import TestClient


@pytest.fixture()
def test_client():
    main.reset_storage()
    with TestClient(WallerAPI.create_app(multiprocess=False)) as client:
        yield client  # testing happens here


def test_upload_file_too_large(test_client):
    mock_file = bytes(2 * 1024 * 1024 + 1)
    res = test_client.post("/jobs", files={"file": ("test", mock_file)})
    assert res.status_code == 400
    assert res.json() == {"detail": "File too large"}


def test_upload_invalid_type(test_client):
    mock_file = bytes(42)
    res = test_client.post("/jobs", files={"file": ("test.gif", mock_file)})
    assert res.status_code == 400
    assert res.json() == {"detail": "Invalid file type"}


@mock.patch("routes.save_file")
@mock.patch("routes.queue_job")
def test_upload_success(
    save_file: mock.AsyncMock, queue_job: mock.AsyncMock, test_client
):
    mock_file = bytes(42)
    res = test_client.post("/jobs", files={"file": ("test.png", mock_file)})
    save_file.assert_called_once()
    queue_job.assert_called_once()
    assert res.status_code == 201
    assert res.json() == {"id": 1}
