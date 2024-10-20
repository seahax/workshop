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

variable "records" {
  type    = any
  default = []
}

module "self" {
  source    = "terraform-aws-modules/route53/aws//modules/records"
  version   = "4.1.0"
  zone_name = var.zone_name
  records   = var.records
}
