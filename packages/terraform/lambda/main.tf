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
  default = "python3.8"
}

variable "architecture" {
  type    = string
  default = "arm64"
}

module "self" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "7.14.0"

  function_name          = var.name
  description            = var.description
  handler                = var.handler
  runtime                = var.runtime
  architectures          = [var.architecture]
  local_existing_package = var.zip
}
