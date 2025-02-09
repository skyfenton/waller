import boto3
import datetime

dynamodb = boto3.resource("dynamodb")
s3 = boto3.client("s3")


def lambda_handler(event, context):
    """Deletes all objects in the waller-images bucket that are older than 30 minutes"""
    table = dynamodb.Table("waller")

    now = datetime.datetime.now()
    delta = datetime.timedelta(minutes=30)
    threshold = now - delta

    old_items = dynamodb.Table("waller").scan(
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
        Bucket="waller-images",
        Delete={
            "Objects": [
                {"Key": f"processed/{item['id']}"} for item in old_items["Items"]
            ]
        },
    )
    # response = s3.list_objects_v2(Bucket="waller-images")
    # if "Contents" in response:
    #     for obj in response["Contents"]:
    #         delete_data()
