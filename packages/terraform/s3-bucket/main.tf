terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

variable "bucket" {
  type = string
}

variable "expiration" {
  type    = map(number)
  default = {}
}

variable "force_destroy" {
  type    = bool
  default = false
}

module "self" {
  source        = "terraform-aws-modules/s3-bucket/aws"
  version       = "4.2.1"
  bucket        = var.bucket
  force_destroy = var.force_destroy
  lifecycle_rule = [for prefix, days in var.expiration : {
    id         = prefix
    enabled    = true
    filter     = { prefix = prefix }
    expiration = { days = days }
  }]
}

output "id" {
  value = module.self.s3_bucket_id
}

output "arn" {
  value = module.self.s3_bucket_arn
}

output "regional_domain_name" {
  value = module.self.s3_bucket_bucket_regional_domain_name
}
