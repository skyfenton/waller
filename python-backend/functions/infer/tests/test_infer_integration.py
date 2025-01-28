from pathlib import Path
import pytest
import boto3
import os
from moto import mock_aws

# TODO: Fix import to show progress of loading model
os.environ["MODEL_PATH"] = "facebook/mask2former-swin-small-ade-semantic"
from src.index import lambda_handler

INPUT_PATH = Path(__file__).parent / "tmp" / "test.jpg"
OUTPUT_PATH = Path(__file__).parent / "tmp" / "output.png"


@pytest.fixture(autouse=True)
def reset():
    OUTPUT_PATH.unlink(missing_ok=True)
    yield


@mock_aws
def test_inference_integration():
    conn = boto3.resource("s3", region_name="us-east-1")
    # We need to create the bucket since this is all in Moto's 'virtual' AWS account
    conn.create_bucket(Bucket="waller-inference")
    # Upload a test image to mock bucket
    with open(INPUT_PATH, "rb") as input_img:
        conn.Object("waller-inference", "queued/test").put(Body=input_img.read())
    print(list(conn.Bucket("waller-inference").objects.all()))
    lambda_handler(
        {
            "Records": [
                {
                    "eventVersion": "2.1",
                    "s3": {
                        "bucket": {"name": "waller-inference"},
                        "object": {"key": "queued/test"},
                    },
                }
            ]
        },
        None,
    )
    assert conn.Object("waller-inference", "processed/test").get()["Body"]
    # Download the processed image
    with open(OUTPUT_PATH, "wb") as output_img:
        output_img.write(
            conn.Object("waller-inference", "processed/test").get()["Body"].read()
        )
