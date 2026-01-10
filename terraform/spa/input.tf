variable "name" {
  description = "Must be unique within your AWS account. Used to generate resource names and tags."
  type        = string
}

variable "region" {
  description = "S3 bucket region."
  type        = string
  default     = "us-east-1"
}

variable "router" {
  description = <<-EOT
    Custom JavaScript string that defines a `router` function to rewrite
    request paths to S3 origin paths.

    The `router` function is given the request path. It can return a new
    path (rewrite) or a falsy value (no rewrite). Generally, it should
    rewrite SPA route paths to HTML files in the S3 bucket. Using a custom
    router overrides the default SPA router behavior.
    
    Must be compatible with CloudFront function JavaScript runtime 2.0.
  EOT

  type    = string
  default = ""
}

variable "viewer_response_function_arn" {
  description = "ARN of a Cloudfront function to associate with viewer response event."
  type        = string
  default     = ""
}

variable "domains" {
  description = "List of aliases (custom domain names) for the Cloudfront distribution. If non-empty, `certificate` is required."
  type        = list(string)
  default     = []
}

variable "certificate" {
  description = "ACM certificate ARN to use for the Cloudfront distribution. Required when using custom domains. Must be in us-east-1."
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

variable "cache_policy_id" {
  description = "ID of the Cloudfront cache policy to use for the default cache behavior."
  type        = string
  default     = ""
}

variable "response_headers_policy_id" {
  description = "ID of the Cloudfront response headers policy to use for the default cache behavior."
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
  distribution_comment            = "SPA: ${var.name}"
  origin_id                       = "spa--${var.name}"
  origin_access_control_name      = "spa--${var.name}"
  viewer_request_function_name    = "spa--${var.name}-viewer-request"
  viewer_request_function_comment = "SPA router: ${var.name}"
  response_headers_policy_name    = "spa--${var.name}"
  response_headers_policy_comment = "SPA security headers: ${var.name}"
  bucket_name                     = "spa--${var.name}-${data.aws_caller_identity.current.account_id}"

  methods = ["GET", "HEAD"]

  error_404_path           = coalesce(var.error_404_path, "/${aws_s3_object.default_404_page.key}")
  default_404_page_key     = ".spa-do-not-modify/404.html"
  default_404_page_content = file("${path.module}/content/404.html.tftpl")

  viewer_request_code = templatefile("${path.module}/content/viewer-request.js.tftpl", {
    router_code = indent(2, chomp(coalesce(var.router, file("${path.module}/content/router.js.tftpl"))))
  })

  cache_policy_id = coalesce(
    var.cache_policy_id,
    data.aws_cloudfront_cache_policy.caching-optimized.id,
  )

  response_headers_policy_id = coalesce(
    var.response_headers_policy_id,
    aws_cloudfront_response_headers_policy.self.id,
  )

  content_security_policy = join(";", [
    "default-src 'self'",
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'"
  ])
}
