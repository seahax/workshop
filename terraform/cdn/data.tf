data "aws_caller_identity" "current" {}

data "aws_cloudfront_cache_policy" "caching-optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_response_headers_policy" "security-headers" {
  name = "Managed-SecurityHeadersPolicy"
}
