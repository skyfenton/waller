import base64
import boto3
import json

s3 = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")


def lambda_handler(event, context):
    id = event["pathParameters"]["id"]

    table = dynamodb.Table("waller")
    response = table.get_item(Key={"id": id})

    if "Item" not in response:
        return {
            "statusCode": 404,
            "body": json.dumps({"error": "Image not found"}),
        }

    if response["Item"]["status"] == "done":
        response = s3.get_object(Bucket="waller-images", Key=f"processed/{id}")
        image_bytes = response["Body"].read()
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "image/png"},
            "body": base64.b64encode(image_bytes).decode("utf-8"),
            "isBase64Encoded": True,
        }

    return {
        "statusCode": 200,
        "body": json.dumps({"status": response["Item"]["status"]}),
    }
