variable "aws_config" {
    type = object({
        shared_config_files      = list(string)
        shared_credentials_files = list(string)
        profile                  = string
    })

    default = {
        shared_config_files      = []
        shared_credentials_files = []
        profile                  = "default"
    }
}

variable "cloudflare_api_token" {
    type = string
}

variable "launch_region" {
    type = string
}

variable "path_to_lambda_folder" {
    type = string
}

variable "api_address" {
    type = object({
      domain = string
      subdomain = string
    })
}

variable "domain_cert_arn" {
    type = string
}