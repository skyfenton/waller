from time import sleep
import uuid
import json
import base64
import binascii
import boto3

dynamodb = boto3.resource("dynamodb")
s3 = boto3.client("s3")

MAX_SIZE_IN_MB = 2
ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png"]


class InvalidUploadException(Exception):
    pass


# SYNCHRONOUS lambda handler
def lambda_handler(event, context):
    try:
        # TODO: Make error handling missing content-type header more descriptive
        if event["headers"]["content-type"] not in ALLOWED_MIME_TYPES:
            raise InvalidUploadException("File type invalid, must be jpeg, jpg, or png")

        # AWS API Gateway automatically converts our allowed mimetypes to
        # base64, so this should always succeed (but we catch it just in case)
        file_bytes = base64.b64decode(event["body"])

        # Lambda also throws 413 if the payload is over 6MB (in which case, the
        # error message will differ slightly)
        if len(file_bytes) > MAX_SIZE_IN_MB * 1024 * 1024:
            return {
                "statusCode": 413,
                "body": f"File too large, maximum size is {MAX_SIZE_IN_MB}MB",
            }

        id = uuid.uuid4()

        s3.put_object(
            Bucket="waller-images",
            Key=f"queued/{id}",
            Body=file_bytes,
            ContentType=event["headers"]["content-type"],
        )

        # Add a new item to the table
        dynamodb.Table("waller").put_item(Item={"id": str(id), "stage": "queued"})

    except (InvalidUploadException, binascii.Error, KeyError) as e:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": type(e).__name__, "detail": str(e)}),
        }

    return {
        "statusCode": 201,
        "body": json.dumps({"id": str(id)}),
    }
