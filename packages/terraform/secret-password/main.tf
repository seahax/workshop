terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

variable "name_prefix" {
  type    = string
  default = null
}

variable "rotation_days" {
  type    = number
  default = 30
}

variable "length" {
  description = "Length of the generated password."
  type        = number
  default     = 32
}

variable "characters" {
  description = "Characters to use in the generated password."
  type        = string
  default     = ""
}

resource "random_password" "self" {
  length  = 16
  special = false
}

locals {
  name = "${var.name_prefix}${random_password.self.result}"
  days = max(1, var.rotation_days)
}

module "rotate" {
  source = "../lambda"

  name = "${local.name}-rotate"
  zip  = "${path.module}/../../lambda-secret-password-rotate/dist/bundle.zip"

  trigger_secrets_manager_enabled = true
}

module "secret" {
  source              = "../secret"
  name                = local.name
  value               = "PLACEHOLDER"
  rotation_days       = max(1, var.rotation_days)
  rotation_lambda_arn = module.rotate.arn
}

output "secret_id" {
  value = module.secret.id
}

output "secret_name" {
  value = module.secret.name
}
