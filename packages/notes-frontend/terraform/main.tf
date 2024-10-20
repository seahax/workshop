terraform {
  required_version = "1.9.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.71.0"
    }
  }

  backend "s3" {
    bucket              = "seahax-terraform"
    key                 = "notes.tfstate"
    dynamodb_table      = "seahax-terraform"
    region              = "us-east-2"
    profile             = "seahax"
    allowed_account_ids = ["194722422414"]
  }
}
