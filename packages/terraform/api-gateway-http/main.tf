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

variable "authorizers" {
  description = "Lambda authorizers."
  type = map(object({
    invoke_arn = string
    cache = optional(object({
      ttl  = number
      keys = list(string)
    }))
  }))
  default = {}
}

variable "routes" {
  description = "Lambda routes with optional authorizer."
  type = map(object({
    invoke_arn = string
    timeout_ms = optional(number)
    authorizer = optional(string)
  }))
  default = {}
}

locals {
  authorizers = {
    for name, options in var.authorizers : name => {
      authorizer_type                   = "REQUEST"
      authorizer_uri                    = options.invoke_arn
      authorizer_payload_format_version = "2.0"
      authorizer_result_ttl_in_seconds  = try(options.cache.ttl, null)
      identity_sources                  = try(options.cache.keys, null)
      enable_simple_responses           = true
    }
  }
  routes = {
    for route, options in var.routes : route => {
      authorization_type = lookup(options, "authorizer", null) == null ? "NONE" : "CUSTOM"
      authorizer_key     = lookup(options, "authorizer", null)
      integration = {
        type                 = "AWS_PROXY"
        uri                  = options.invoke_arn
        timeout_milliseconds = lookup(options, "timeout_ms", null)
      }
    }
  }
}

module "self" {
  source  = "terraform-aws-modules/apigateway-v2/aws"
  version = "5.2.0"

  name                  = var.name
  protocol_type         = "HTTP"
  create_domain_name    = false
  create_domain_records = false
  create_certificate    = false

  authorizers = local.authorizers
  routes      = local.routes
}
