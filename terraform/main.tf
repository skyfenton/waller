provider "aws" {
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
  region     = var.aws_region

  default_tags {
    tags = {
      managed-by = "terraform"
      project    = "waller"
    }
  }
}

locals {
  lambda_folder_path = abspath("${path.root}/../python-backend/functions")
}

module "dynamodb_table" {
  source  = "terraform-aws-modules/dynamodb-table/aws"
  version = "~> 4.0"

  name = "waller"

  billing_mode   = "PROVISIONED"
  read_capacity  = 5
  write_capacity = 3

  hash_key = "id"
  attributes = [
    {
      name = "id"
      type = "S"
    }
  ]
}
