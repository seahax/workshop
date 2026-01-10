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
    key                 = "seahax-spa.tfstate"
    allowed_account_ids = ["194722422414"]
  }
}

provider "aws" {
  region              = "us-west-2"
  allowed_account_ids = ["194722422414"]
}
