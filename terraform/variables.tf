variable "aws_config" {
    type = object({
        shared_config_files      = list(string)
        shared_credentials_files = list(string)
        profile                  = string
    })

    default = {
        profile                  = "default"
    }
}

variable "launch_region" {
    type = string
}

variable "path_to_lambda_folder" {
    type = string
}