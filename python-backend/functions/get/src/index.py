import base64
import boto3

s3 = boto3.client("s3")


def lambda_handler(event, context):
    id = event["pathParameters"]["id"]

    # TODO: query DynamoDB first to get status (cheaper than asking S3)

    response = s3.get_object(Bucket="waller-images", Key=f"processed/{id}")

    image_bytes = response["Body"].read()

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "image/png"},
        "body": base64.b64encode(image_bytes).decode("utf-8"),
        "isBase64Encoded": True,
    }
