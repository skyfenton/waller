import uuid
import json
import base64

# TODO: add boto3 to lambda layer
import boto3

dynamodb = boto3.resource("dynamodb")
s3 = boto3.client("s3")


def lambda_handler(event, context):
    # TODO: consolidate and validate data types
    id = uuid.uuid4()

    img = base64.b64decode(event["body"])

    # upload image from API gateway request to s3
    s3.put_object(
        Bucket="waller-images",
        Key=f"queued/{id}",
        Body=img,
        ContentType=event["headers"]["content-type"],
    )

    # Add a new item to the table
    # dynamodb.Table('jobs').put_item(
    #     Item={
    #         'id': id,
    #         'status': 'queued'
    #     }
    # )

    return {
        "statusCode": 200,
        "body": json.dumps({"id": str(id)}),
    }
