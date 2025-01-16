from io import BytesIO
import boto3
from PIL import Image, ImageOps
# from waller_lib import WallerProcess

MAJOR_EVENT_VERSION = "2"

# model = WallerProcess()
s3 = boto3.client("s3")


def lambda_handler(event, context):
    for record in event["Records"]:
        # check if event matches current version
        if record["eventVersion"].split(".")[0] != MAJOR_EVENT_VERSION:
            raise Exception(f"Unsupported event version: {record['eventVersion']}")

        key = record["s3"]["object"]["key"]
        id = key.split("/")[-1]

        # TODO: update dynamo db status to processing

        bucket = record["s3"]["bucket"]["name"]

        print("Loading image from s3... (bucket: %s, key: %s)" % (bucket, key))
        # Load image from s3
        image_bytes = s3.get_object(Bucket=bucket, Key=key)["Body"].read()
        print(str(image_bytes[:128]) + f"... ({len(image_bytes)})")

        image = Image.open(BytesIO(image_bytes))

        # # run image segmentation model
        # out = model.process_image(image)

        print("Processing image...")

        out = ImageOps.grayscale(image)

        # Save the image to a bytes buffer
        print("Saving image to buffer...")

        buffer = BytesIO()
        out.save(buffer, format="PNG")
        buffer.seek(0)

        print(
            "Uploading image to s3... (bucket: %s, key: %s)"
            % (bucket, f"processed/{id}")
        )

        # upload output to s3 bucket
        s3.put_object(
            Bucket=bucket, Key=f"processed/{id}", Body=buffer, ContentType="image/png"
        )
