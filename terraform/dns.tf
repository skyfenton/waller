provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

data "cloudflare_zones" "skyfenton_com" {
  filter {
    name = var.api_address_domain
  }
}

# create a DNS record for the API gateway
resource "cloudflare_record" "api_gateway_record" {
  zone_id = data.cloudflare_zones.skyfenton_com.zones[0].id
  name    = var.api_address_subdomain
  content = module.api_gateway.domain_name_target_domain_name
  type    = "CNAME"
  proxied = true

  comment = "CNAME record for the Waller API gateway; Terraform"
}
