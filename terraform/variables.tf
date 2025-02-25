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

variable "api_address" {
  type = object({
    subdomain = string
    domain    = string
  })
}

variable "domain_cert_arn" {
  type = string
}

variable "expire_jobs_after_minutes" {
  type    = number
  default = 30
}
