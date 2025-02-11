output "api_address" {
  value = local.fqdn
}

output "inference_image_details" {
  value = module.inference_image.image_uri
}
