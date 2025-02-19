import datetime as dt
from io import BytesIO
import os
import boto3
from PIL import Image
from src.waller.waller_lib import WallerProcess

MAJOR_EVENT_VERSION = "2"
TABLE_NAME = os.environ["TABLE_NAME"]

model = WallerProcess()
s3 = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")


def lambda_handler(event, context):
    """When an image is uploaded to s3, this function processes it through the
    image processing pipeline and updates its status in the database."""
    for record in event["Records"]:
        # check if event matches expected version
        if record["eventVersion"].split(".")[0] != MAJOR_EVENT_VERSION:
            raise Exception(f"Unsupported event version: {record['eventVersion']}")

        bucket = record["s3"]["bucket"]["name"]
        key = record["s3"]["object"]["key"]
        id = key.split("/")[-1]

        print("Loading image... (bucket: %s, key: %s)" % (bucket, key))

        # Load image from s3
        image_bytes = s3.get_object(Bucket=bucket, Key=key)["Body"].read()
        image = Image.open(BytesIO(image_bytes))

        # Update the status in the database before processing
        dynamodb.Table(TABLE_NAME).update_item(
            Key={"id": id},
            UpdateExpression="SET stage = :stage",
            ExpressionAttributeValues={":stage": "processing"},
        )

        # Process the image
        out = model.process_image(image)

        # Save the image to a buffer for upload
        buffer = BytesIO()
        out.save(buffer, format="PNG")
        buffer.seek(0)

        output_key = f"processed/{id}"

        print(
            "Uploading processed image... (bucket: %s, key: %s)" % (bucket, output_key)
        )

        s3.put_object(
            Bucket=bucket, Key=output_key, Body=buffer, ContentType="image/png"
        )

        dynamodb.Table(TABLE_NAME).update_item(
            Key={"id": id},
            UpdateExpression="SET stage = :stage, modified_at = :timestamp",
            ExpressionAttributeValues={
                ":stage": "done",
                ":timestamp": int(dt.datetime.now(dt.UTC).timestamp()),
            },
        )

        # Delete the original image to save storage cost
        s3.delete_object(Bucket=bucket, Key=key)
