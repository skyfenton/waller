# Waller

Fullstack app to replace walls in a user-uploaded image with various textures by processing them through an image segmentation ML model!

(Screenshots coming soon)

Backend is deployed to AWS Lambda for serverless inference, using Terraform to provision resources (DynamoDB, S3, API Gateway, CloudWatch, Elastic Container Repository).

For the previous version built using FastAPI on the backend, see branch [v1-fastapi](https://github.com/skyfenton/waller/tree/v1-fastapi/).
