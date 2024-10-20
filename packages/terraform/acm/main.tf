terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

variable "zone_name" {
  type = string
}

variable "domain_name" {
  type    = string
  default = ""
}

variable "subject_alternative_names" {
  type    = list(string)
  default = []
}

locals {
  domain_name = coalesce(var.domain_name, var.zone_name)
}

data "aws_route53_zone" "self" {
  name = var.zone_name
}

module "self" {
  source  = "terraform-aws-modules/acm/aws"
  version = "5.1.1"

  domain_name               = local.domain_name
  subject_alternative_names = var.subject_alternative_names

  validation_method   = "DNS"
  zone_id             = data.aws_route53_zone.self.zone_id
  wait_for_validation = false
}

output "arn" {
  value = module.self.acm_certificate_arn
}
