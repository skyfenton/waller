import os
import boto3
import json

EXPIRE_IN_MINUTES = int(os.environ["EXPIRE_IN_MINUTES"])
TABLE_NAME = os.environ["TABLE_NAME"]
BUCKET_NAME = os.environ["BUCKET_NAME"]

s3 = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")


def lambda_handler(event, context):
    """Gets the status of the requested job ID, including
    a presigned URL to the processed image if the job has completed."""
    id = event["pathParameters"]["id"]

    table = dynamodb.Table(TABLE_NAME)
    response = table.get_item(Key={"id": id})

    if "Item" not in response:
        return {
            "statusCode": 404,
            "body": json.dumps({"error": "Image not found"}),
        }

    if response["Item"]["stage"] == "done":
        url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": BUCKET_NAME, "Key": f"processed/{id}"},
            ExpiresIn=EXPIRE_IN_MINUTES * 60,
        )
        return {"statusCode": 200, "body": json.dumps({"status": "done", "url": url})}

    return {
        "statusCode": 200,
        "body": json.dumps({"status": response["Item"]["stage"]}),
    }
