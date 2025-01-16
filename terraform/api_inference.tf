data "aws_caller_identity" "this" {}

data "aws_ecr_authorization_token" "token" {}

provider "docker" {
  registry_auth {
    address  = data.aws_ecr_authorization_token.token.proxy_endpoint
    username = data.aws_ecr_authorization_token.token.user_name
    password = data.aws_ecr_authorization_token.token.password
  }
}

# TODO: Isolate locals from module

locals {
  source_path   = "${local.lambda_folder_path}/infer/src"
  path_include  = ["**"]
  path_exclude  = ["**/__pycache__/**"]
  files_include = setunion([for f in local.path_include : fileset(local.source_path, f)]...)
  files_exclude = setunion([for f in local.path_exclude : fileset(local.source_path, f)]...)
  files         = sort(setsubtract(local.files_include, local.files_exclude))

  dir_sha = sha1(join("", [for f in local.files : filesha1("${local.source_path}/${f}")]))
}

module "inference_image" {
  source  = "terraform-aws-modules/lambda/aws//modules/docker-build"
  version = "~> 7.0"

  create_ecr_repo = true
  ecr_repo        = "waller-inference"
  ecr_repo_lifecycle_policy = jsonencode({
    "rules" : [
      {
        "rulePriority" : 1,
        "description" : "Keep only the last 2 images",
        "selection" : {
          "tagStatus" : "any",
          "countType" : "imageCountMoreThan",
          "countNumber" : 2
        },
        "action" : {
          "type" : "expire"
        }
      }
    ]
  })

  use_image_tag = false # If false, sha of the image will be used
  # image_tag     = "latest"

  force_remove = true

  source_path = local.source_path
  platform    = "linux/amd64"
  # build_args = {
  #   FOO = "bar"
  # }

  triggers = {
    dir_sha = local.dir_sha
  }
}

output "inference_image_details" {
  value = module.inference_image.image_uri
}

module "inference_lambda" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 7.0"

  function_name  = "waller-inference"
  create_package = false

  package_type  = "Image"
  architectures = ["x86_64"]
  image_uri     = module.inference_image.image_uri

  memory_size = 512
  timeout     = 15

  create_async_event_config    = true
  maximum_event_age_in_seconds = 120
  maximum_retry_attempts       = 0

  # attach_tracing_policy = true
  attach_policy_jsons    = true
  number_of_policy_jsons = 2
  policy_jsons           = [data.aws_iam_policy_document.put_object_policy.json, data.aws_iam_policy_document.get_object_policy.json]
}

module "s3_notifications" {
  source  = "terraform-aws-modules/s3-bucket/aws//modules/notification"
  version = "~> 4.3"

  bucket = module.waller_image_bucket.s3_bucket_id

  lambda_notifications = {
    inference_lambda = {
      function_arn  = module.inference_lambda.lambda_function_arn
      function_name = module.inference_lambda.lambda_function_name
      events        = ["s3:ObjectCreated:*"]
      filter_prefix = "queued/"
    }
  }
}
