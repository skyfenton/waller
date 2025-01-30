import base64
import boto3

s3 = boto3.client("s3")


def lambda_handler(event, context):
    id = event["pathParameters"]["id"]
    try:
        response = s3.get_object(Bucket="waller-images", Key=f"processed/{id}")
    except s3.exceptions.ClientError:
        return {
            "statusCode": 404,
            "body": {"error": "NoSuchKey", "detail": "Image not found"},
        }

    image_bytes = response["Body"].read()

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "image/png"},
        "body": base64.b64encode(image_bytes).decode("utf-8"),
        "isBase64Encoded": True,
    }
