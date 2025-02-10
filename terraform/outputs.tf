output "api_address" {
  value = var.api_address
}

output "inference_image_details" {
  value = module.inference_image.image_uri
}
