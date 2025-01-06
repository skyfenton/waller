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

  function_name = "waller-test"
  description   = "Lambda for testing waller API"
  handler       = "index.lambda_handler"
  runtime       = "python3.12"
  publish       = true

  source_path = "${local.lambda_folder_path}/test"

  allowed_triggers = {
    AllowExecutionFromAPIGateway = {
      service    = "apigateway"
      source_arn = "${module.api_gateway.api_execution_arn}/*/*"
    }
  }
}

module "waller_image_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "4.3.0"

  bucket        = "waller-images"
  force_destroy = true

  # attach_deny_insecure_transport_policy = true
  # attach_require_latest_tls_policy      = true

  # lambda_function = 
}

data "aws_iam_policy_document" "put_object_policy" {
  statement {
    effect = "Allow"
    actions = [
      "s3:PutObject"
    ]
    resources = [
      "arn:aws:s3:::waller-images/*"
    ]
  }
}

module "upload_lambda" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 7.0"

  function_name = "waller-upload"
  description   = "Lambda for uploading images for waller"
  handler       = "index.lambda_handler"
  runtime       = "python3.12"
  publish       = true

  source_path = "${local.lambda_folder_path}/upload"

  allowed_triggers = {
    AllowExecutionFromAPIGateway = {
      service    = "apigateway"
      source_arn = "${module.api_gateway.api_execution_arn}/*/*"
    }
  }

  attach_policy_json = true
  policy_json        = data.aws_iam_policy_document.put_object_policy.json
}

module "api_gateway" {
  source  = "terraform-aws-modules/apigateway-v2/aws"
  version = "~> 5.0"

  name          = "waller-api-gateway"
  description   = "HTTP API Gateway for Waller"
  protocol_type = "HTTP"

  domain_name                 = "${var.api_address.subdomain}.${var.api_address.domain}"
  domain_name_certificate_arn = var.domain_cert_arn
  create_certificate          = false
  create_domain_records       = false

  routes = {
    "POST /test" = {
      integration = {
        uri                    = module.test_lambda.lambda_function_arn
        payload_format_version = "2.0"
      }
    }

    "POST /upload" = {
      integration = {
        uri                    = module.upload_lambda.lambda_function_arn
        payload_format_version = "2.0"
      }
    }
  }
}
