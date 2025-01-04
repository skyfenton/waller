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

module "test_lambda" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 7.0"

  function_name = "test-lambda"
  description   = "Lambda for testing waller API"
  handler = "index.lambda_handler"
  runtime = "python3.12"
  publish = true

  source_path = "${local.lambda_folder_path}/test"
}

module "dev_alias" {
  source  = "terraform-aws-modules/lambda/aws//modules/alias"
  version = "~> 7.0"

  name          = "dev"

  refresh_alias = false

  function_name = module.test_lambda.lambda_function_name
  function_version = "$LATEST"

  allowed_triggers = {
    AllowExecutionFromAPIGateway = {
      service    = "apigateway"
      source_arn = "${module.api_gateway.api_execution_arn}/*/*/test"
    }
  }
}

# module "upload_lambda" {
#   source  = "terraform-aws-modules/lambda/aws"
#   version = local.lambda_module_version

#   function_name = "upload-lambda"
#   handler = "index.lambda_handler"
#   runtime = "python3.12"

#   source_path = "${local.lambda_folder_path}/upload"

#   tags = {
#     name="upload-lambda"
#   }
# }

module "api_gateway" {
  source = "terraform-aws-modules/apigateway-v2/aws"
  version = "~> 5.0"

  name          = "waller-api-gateway"
  description   = "HTTP API Gateway for Waller"
  protocol_type = "HTTP"

  # domain_name = var.api_domain_name
  # domain_name_certificate_arn = var.domain_cert_arn
  create_domain_name = false
  create_certificate = false
  create_domain_records = false

  routes = {
    "POST /test" = {
      integration = {
        uri                    = module.dev_alias.lambda_alias_arn
        payload_format_version = "2.0"
        timeout_milliseconds   = 12000
      }
    }
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
