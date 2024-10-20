module "ssl" {
  source                    = "../../terraform/acm"
  providers                 = { aws = aws.global }
  zone_name                 = "seahax.com"
  domain_name               = "notes.seahax.com"
  subject_alternative_names = ["*.notes.seahax.com"]
}

module "frontend" {
  source              = "../../terraform/cloudfront-spa"
  domain_name         = "notes.seahax.com"
  aliases             = ["www.notes.seahax.com"]
  acm_certificate_arn = module.ssl.arn
}

module "dns" {
  source    = "../../terraform/route53-records"
  zone_name = "seahax.com"
  records = [
    { type = "A", name = "notes", alias = module.frontend.route53_alias },
    { type = "A", name = "www.notes", alias = module.frontend.route53_alias }
  ]
}

output "cloudfront_id" {
  value = module.frontend.id
}
