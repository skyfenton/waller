import api as WallerAPI
from fastapi.testclient import TestClient


client = TestClient(WallerAPI.app)


def test_upload_file_too_large():
    mock_file = bytes(2 * 1024 * 1024 + 1)
    res = client.post("/upload", files={"file": ("test", mock_file)})
    assert res.status_code == 400
    assert res.json() == {"detail": "File too large"}


def test_upload_invalid_type():
    mock_file = bytes(42)
    res = client.post("/upload", files={"file": ("test.webp", mock_file)})
    assert res.status_code == 400
    assert res.json() == {"detail": "Invalid file type"}


def test_upload_success():
    pass
