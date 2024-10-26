terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

variable "name" {
  type    = string
  default = null
}

variable "name_prefix" {
  type    = string
  default = ""
}

variable "value" {
  type = string
}

variable "description" {
  type    = string
  default = null
}

variable "rotation_days" {
  type    = number
  default = 7
}

variable "rotation_lambda_arn" {
  type    = string
  default = null
}

resource "random_password" "self" {
  length  = 16
  special = false
}

locals {
  name = coalesce(var.name, "${var.name_prefix}${random_password.self.result}")
}

module "secrets_manager" {
  source  = "terraform-aws-modules/secrets-manager/aws"
  version = "1.3.1"

  name                  = local.name
  description           = var.description
  secret_string         = var.value
  ignore_secret_changes = var.rotation_days > 0
}

resource "aws_secretsmanager_secret_rotation" "self" {
  count               = var.rotation_days > 0 ? 1 : 0
  secret_id           = module.secrets_manager.secret_id
  rotation_lambda_arn = var.rotation_lambda_arn
  rotate_immediately  = true

  rotation_rules {
    automatically_after_days = var.rotation_days
  }
}

output "id" {
  value = module.secrets_manager.secret_id
}

output "name" {
  value = module.secrets_manager.secret_name
}
