variable "aws_access_key" {
  type = string
}

variable "aws_secret_key" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "cloudflare_api_token" {
  type = string
}

# variable "api_address" {
#   type = object({
#     subdomain = string
#     domain    = string
#   })
# }

variable "api_address_subdomain" {
  type = string
}

variable "api_address_domain" {
  type = string
}

variable "domain_cert_arn" {
  type = string
}

variable "expire_jobs_after_minutes" {
  type    = number
  default = 30
}
