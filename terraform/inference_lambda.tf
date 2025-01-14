provider "docker" {}

locals {
  source_path   = "${local.lambda_folder_path}/infer"
  path_include  = ["**"]
  path_exclude  = ["**/__pycache__/**"]
  files_include = setunion([for f in local.path_include : fileset(local.source_path, f)]...)
  files_exclude = setunion([for f in local.path_exclude : fileset(local.source_path, f)]...)
  files         = sort(setsubtract(local.files_include, local.files_exclude))

  dir_sha = sha1(join("", [for f in local.files : filesha1("${local.source_path}/${f}")]))

  public_ecr_address = trimsuffix(module.public_ecr.repository_url, "/${module.public_ecr.repository_name}")
}

module "public_ecr" {
  source = "terraform-aws-modules/ecr/aws"

  repository_name = "waller-inference"
  repository_type = "public"

  public_repository_catalog_data = {
    description = "Docker container for inferring images through an image segmentation model"
    # about_text        = file("${path.module}/files/ABOUT.md")
    # usage_text        = file("${path.module}/files/USAGE.md")
    operating_systems = ["Linux"]
    architectures     = ["x86-64"]
    # logo_image_blob   = filebase64("${path.module}/files/clowd.png")
  }

  # repository_lambda_read_access_arns = [module.infer_lambda.lambda_function_arn]

  repository_force_delete = true

  create_lifecycle_policy = true
  repository_lifecycle_policy = jsonencode({
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
}

output "public_ecr_repository" {
  value = module.public_ecr
}

resource "docker_image" "image" {
  name = "waller-inference-image"

  build {
    context = local.source_path
  }

  triggers = {
    dir_sha = local.dir_sha
  }
}

resource "null_resource" "push_to_ecr" {
  provisioner "local-exec" {
    command = <<EOT
aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws
docker tag ${docker_image.image.image_id} ${module.public_ecr.repository_url}:latest
docker push ${module.public_ecr.repository_url}:latest
EOT
  }
}

# module "infer_docker_build" {
#   source = "terraform-aws-modules/lambda/aws//modules/docker-build"

#   create_ecr_repo = false
#   ecr_address     = local.public_ecr_address
#   ecr_repo        = module.public_ecr.repository_name

#   use_image_tag = true # If false, sha of the image will be used
#   image_tag     = "0.0.1"

#   force_remove = true

#   source_path = local.source_path
#   platform    = "linux/amd64"
#   # build_args = {
#   #   FOO = "bar"
#   # }

#   triggers = {
#     dir_sha = local.dir_sha
#   }

#   cache_from = ["${module.public_ecr.repository_url}:latest"]
# }

# data "aws_ecr_image" "service_image" {
#   repository_name = module.public_ecr.repository_name

#   most_recent = true
# depends_on = [null_resource.push_to_ecr]
# }

# output "aws_ecr_image" {
#   value = data.aws_ecr_image.service_image
# }

# module "infer_lambda" {
#   source  = "terraform-aws-modules/lambda/aws"
#   version = "~> 7.0"

#   function_name = "waller-inference-lambda"
#   description   = "Lambda for testing waller API"

#   create_package = false

#   # Container Image
#   package_type  = "Image"
#   architectures = ["x86_64"]

#   image_uri = module.aws_ecr_image.service_image.image_uri
# }

# module "s3_notifications" {
#   source  = "terraform-aws-modules/s3-bucket/aws//modules/notification"
#   version = "~> 4.3"

#   bucket = module.waller_image_bucket.s3_bucket_id

#   lambda_notifications = {
#     infer_lambda = {
#       function_arn  = module.infer_lambda.lambda_function_arn
#       function_name = module.infer_lambda.lambda_function_name
#       events        = ["s3:ObjectCreated:*"]
#       filter_prefix = "queued/"
#     }
#   }
# }
