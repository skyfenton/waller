module "upload_lambda" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 7.0"

  function_name = "waller-upload"
  description   = "Upload image for a new Waller job"
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

  attach_policy_jsons    = true
  number_of_policy_jsons = 2
  policy_jsons           = [data.aws_iam_policy_document.put_object_policy.json, data.aws_iam_policy_document.db_put_policy.json]
}

module "get_item_lambda" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 7.0"

  function_name = "waller-get"
  description   = "Get job status for Waller"
  handler       = "index.lambda_handler"
  runtime       = "python3.12"
  publish       = true

  source_path = "${local.lambda_folder_path}/get/src"

  allowed_triggers = {
    AllowExecutionFromAPIGateway = {
      service    = "apigateway"
      source_arn = "${module.api_gateway.api_execution_arn}/*/*"
    }
  }

  attach_policy_json = true
  policy_json        = data.aws_iam_policy_document.get_object_policy.json
}
