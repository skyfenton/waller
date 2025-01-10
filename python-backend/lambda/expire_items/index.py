import boto3
import datetime

s3 = boto3.client("s3")


def lambda_handler(event, context):
    """Deletes all objects in the waller-images bucket that are older than 30 minutes"""

    now = datetime.datetime.now(datetime.timezone.utc)
    delta = datetime.timedelta(minutes=30)
    threshold = now - delta

    response = s3.list_objects_v2(Bucket="waller-images")
    if "Contents" in response:
        for obj in response["Contents"]:
            try:
                if obj["LastModified"] < threshold:
                    s3.delete_object(Bucket="waller-images", Key=obj["Key"])
            except Exception as e:
                print(obj)
                raise e
