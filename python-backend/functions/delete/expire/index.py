import datetime as dt
import os

import boto3

BUCKET_NAME = os.environ["BUCKET_NAME"]
TABLE_NAME = os.environ["TABLE_NAME"]

EXPIRE_IN_MINUTES = int(os.environ["EXPIRE_IN_MINUTES"])

s3 = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")


def lambda_handler(event, context):
    """Deletes all objects in the waller-images bucket that are older than 30
    minutes, triggered by a cron scheduled event on EventBridge"""
    now = dt.datetime.now(dt.UTC)
    delta = dt.timedelta(minutes=EXPIRE_IN_MINUTES)
    threshold = now - delta

    table = dynamodb.Table(TABLE_NAME)
    # TODO: Group items into batches and delete prior batch
    # Should save time and cost on reads instead of scanning all items
    old_items = table.scan(
        Select="ALL_ATTRIBUTES",
        FilterExpression="modified_at < :threshold AND stage = :stage",
        ExpressionAttributeValues={
            ":threshold": int(threshold.timestamp()),
            ":stage": "done",
        },
    )

    with table.batch_writer() as batch:
        for item in old_items["Items"]:
            batch.delete_item(Key={"id": item["id"]})

    s3.delete_objects(
        Bucket=BUCKET_NAME,
        Delete={
            "Objects": [
                {"Key": f"processed/{item['id']}"} for item in old_items["Items"]
            ]
        },
    )
