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
    "POST /jobs" = {
      integration = {
        uri                    = module.upload_lambda.lambda_function_arn
        payload_format_version = "2.0"
      }
    }
    "GET /jobs/{id}" = {
      integration = {
        uri                    = module.get_item_lambda.lambda_function_arn
        payload_format_version = "2.0"
      }
    }
  }
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
