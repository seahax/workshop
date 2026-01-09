variable "name" {
  description = "Name of the SPA deployment. Must be unique within the AWS account."
  type        = string
}

variable "region" {
  description = "S3 bucket region."
  type        = string
  default     = "us-east-1"
}

variable "domains" {
  description = "List of aliases (domain names) for the Cloudfront distribution."
  type        = list(string)
  default     = []
}

variable "certificate" {
  description = "ARN of the ACM certificate to use for the Cloudfront distribution. Must be in us-east-1. Required when using custom domains."
  type        = string
  default     = ""
  validation {
    condition     = var.certificate == "" || can(regex("^arn:aws:acm:us-east-1:[[:digit:]]{12}:certificate/[a-f0-9-]{36}$", var.certificate))
    error_message = "Not a valid ACM certificate ARN in us-east-1."
  }
}

variable "min_tls_version" {
  description = "Minimum TLS version for the Cloudfront distribution. Only used if using custom domains."
  type        = string
  default     = "TLSv1.2_2021"
}

variable "error_404_path" {
  description = "Origin path to serve when a matching S3 object is not found."
  type        = string
  default     = ""
}

variable "force_destroy" {
  description = "Destroy the S3 bucket and its contents."
  type        = bool
  default     = false
}

resource "terraform_data" "validation" {
  triggers_replace = [
    var.domains,
    var.certificate,
  ]

  lifecycle {
    precondition {
      condition     = length(var.domains) == 0 || var.certificate != ""
      error_message = "Certificate required for custom domains."
    }
  }
}

locals {
  distribution_comment         = "SPA: ${var.name}"
  origin_id                    = "spa--${var.name}"
  origin_access_control_name   = "spa--${var.name}"
  viewer_request_function_name = "spa--${var.name}-viewer-request"
  response_headers_policy_name = "spa--${var.name}"
  bucket_name                  = "spa--${var.name}-${data.aws_caller_identity.current.account_id}"
  methods                      = ["GET", "HEAD"]
}
