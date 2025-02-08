module "waller_image_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 4.3"

  bucket        = "waller-images"
  force_destroy = true

  # attach_deny_insecure_transport_policy = true
  # attach_require_latest_tls_policy      = true

  # lambda_function = 
}

data "aws_iam_policy_document" "expire_objects_policy" {
  statement {
    effect = "Allow"
    actions = [
      "s3:ListBucket",
    ]
    resources = [
      "arn:aws:s3:::waller-images"
    ]
  }
  statement {
    effect = "Allow"
    actions = [
      "s3:DeleteObject"
    ]
    resources = [
      "arn:aws:s3:::waller-images/*"
    ]
  }
}

module "expire_objects_lambda" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 7.0"

  function_name = "expire-waller-images"
  description   = "Handles expiring old files in waller bucket via cron job"
  handler       = "index.lambda_handler"
  runtime       = "python3.12"
  publish       = true

  source_path = "${local.lambda_folder_path}/delete/expire"

  trusted_entities = ["scheduler.amazonaws.com"]

  allowed_triggers = {
    ScanAmiRule = {
      principal  = "scheduler.amazonaws.com"
      source_arn = module.eventbridge.eventbridge_schedule_arns["lambda-cron"]
    }
  }

  attach_policy_json = true
  policy_json        = data.aws_iam_policy_document.expire_objects_policy.json
}

module "eventbridge" {
  source = "terraform-aws-modules/eventbridge/aws"

  create_bus = false

  attach_lambda_policy = true
  lambda_target_arns   = [module.expire_objects_lambda.lambda_function_arn]

  schedules = {
    lambda-cron = {
      description         = "Trigger for a Lambda"
      schedule_expression = "rate(30 minutes)"
      timezone            = "Europe/London"
      arn                 = module.expire_objects_lambda.lambda_function_arn
      input               = jsonencode({ "job" : "cron-by-rate" })
      retry_policy = {
        maximum_retry_attempts       = 3
        maximum_event_age_in_seconds = 300
      }
    }
  }
}
