terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

variable "name" {
  type = string
}

variable "description" {
  type    = string
  default = null
}

variable "zip" {
  type = string
}

variable "handler" {
  type    = string
  default = "index.handler"
}

variable "runtime" {
  type    = string
  default = "nodejs20.x"
}

variable "architecture" {
  type    = string
  default = "arm64"
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

module "self" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "7.14.0"

  function_name              = var.name
  description                = var.description
  handler                    = var.handler
  runtime                    = var.runtime
  architectures              = [var.architecture]
  create_package             = false
  local_existing_package     = var.zip

  authorization_type                      = "AWS_IAM"
  create_current_version_allowed_triggers = false
  allowed_triggers = {
    api_gateway = {
      service    = "apigateway",
      source_arn = "arn:aws:execute-api:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
    }
  }
}

output "uri" {
  value = module.self.lambda_function_url
}
