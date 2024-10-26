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

variable "env" {
  type    = map(string)
  default = {}
}

variable "runtime" {
  type    = string
  default = "nodejs20.x"
}

variable "architecture" {
  type    = string
  default = "arm64"
}

variable "trigger_api_gateway_enabled" {
  type    = bool
  default = false
}

variable "trigger_secrets_manager_enabled" {
  type    = bool
  default = false
}

variable "policy_statements" {
  type    = map(any)
  default = {}
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

module "self" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "7.14.0"

  function_name = var.name
  description   = var.description
  handler       = var.handler
  runtime       = var.runtime
  architectures = [var.architecture]

  create_package         = false
  local_existing_package = var.zip

  authorization_type                      = "AWS_IAM"
  create_current_version_allowed_triggers = false
  allowed_triggers = merge(
    var.trigger_api_gateway_enabled ? {
      api_gateway = {
        principal  = "apigateway.amazonaws.com",
        source_arn = "arn:aws:execute-api:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
      }
    } : {},
    var.trigger_secrets_manager_enabled ? {
      secrets_manager = {
        principal  = "secretsmanager.amazonaws.com"
        source_arn = "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:*"
      }
    } : {}
  )

  attach_policy_statements = var.trigger_secrets_manager_enabled || length(keys(var.policy_statements)) > 0
  policy_statements = merge(
    var.trigger_secrets_manager_enabled ? {
      secret_rotate = {
        effect = "Allow"
        actions = [
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetSecretValue",
          "secretsmanager:PutSecretValue",
          "secretsmanager:UpdateSecretVersionStage"
        ]
        resources = ["arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:*"]
      },
      secrets_generate_password = {
        effect = "Allow"
        actions = [
          "secretsmanager:GetRandomPassword",
        ]
        resources = ["*"]
      }
    } : {},
    var.policy_statements
  )

  environment_variables = var.env
}

output "arn" {
  value = module.self.lambda_function_arn
}

output "invoke_arn" {
  value = module.self.lambda_function_invoke_arn
}
