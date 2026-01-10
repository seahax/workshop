terraform {
  required_version = ">= 1.14"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  backend "s3" {
    bucket              = "tfstates-194722422414"
    region              = "us-west-2"
    key                 = "spa-demo.tfstate"
    allowed_account_ids = ["194722422414"]
  }
}

provider "aws" {
  region              = "us-east-1"
  allowed_account_ids = ["194722422414"]
}

module "spa" {
  source = "../"
  name   = "demo"
  region = "us-east-1"
  # error_404_path = "/404.html"
  domains       = ["spa.seahax.com"]
  certificate   = "arn:aws:acm:us-east-1:194722422414:certificate/ef628864-f3dd-4d46-8d5e-b2e4bcf7a5e4"
  force_destroy = true
}

output "bucket_name" {
  value = module.spa.bucket_name
}

output "distribution_domain" {
  value = module.spa.distribution_domain
}

output "distribution_id" {
  value = module.spa.distribution_id
}
