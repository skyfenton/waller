provider "aws" {
  # region = var.launch_region
  shared_config_files      = var.aws_config.shared_config_files
  shared_credentials_files = var.aws_config.shared_credentials_files
  profile                  = var.aws_config.profile

  default_tags {
    tags = {
      managed-by = "terraform"
      project    = "waller"
    }
  }
}

locals {
  lambda_folder_path = abspath(var.path_to_lambda_folder)
}

module "lambda_function" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 7.0"

  function_name = "test-lambda"
  # description   = "My awesome lambda function"
  handler = "index.lambda_handler"
  runtime = "python3.12"

  source_path = "${local.lambda_folder_path}/test"

  tags = {
    name = "test-lambda"
  }
}

# resource "aws_s3_bucket" "waller-images" {
#   bucket = "waller-images"

#   tags = {
#     Name        = "waller-images"
#     Environment = "dev"
#   }
# }

# resource "aws_s3_bucket_acl" "waller-images" {
#   bucket = aws_s3_bucket.waller-images.id
#   acl    = "private"
# }

# data "aws_iam_policy_document" "lambda_policy_document" {
#   # statement {
#   #   effect = "Allow"
#   #   actions = [
#   #     "dynamodb:PutItem"
#   #   ]
#   #   resources = [
#   #     aws_dynamodb_table.email_collector.arn
#   #   ]
#   # }
# }

# resource "aws_iam_policy" "lambda_policy" {
#   name   = "test-policy"
#   policy = data.aws_iam_policy_document.lambda_policy_document.json
# }

# data "aws_iam_policy_document" "lambda_execution_policy_document" {
#   statement {
#     effect = "Allow"

#     principals {
#       type        = "Service"
#       identifiers = ["lambda.amazonaws.com"]
#     }

#     actions = ["sts:AssumeRole"]
#   }
# }

# resource "aws_iam_role" "test_lambda_role" {
#   name               = "test-lambda-role"
#   assume_role_policy = data.aws_iam_policy_document.lambda_execution_policy_document.json
# }
