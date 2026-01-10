resource "aws_s3_bucket" "self" {
  bucket        = local.bucket_name
  region        = var.region
  force_destroy = var.force_destroy
  tags = {
    SPA = var.name
  }
}

resource "aws_s3_object" "default_404_page" {
  bucket        = aws_s3_bucket.self.id
  region        = var.region
  key           = local.default_404_page_key
  content       = local.default_404_page_content
  content_type  = "text/html; charset=utf-8"
  cache_control = "public, max-age=60, stale-while-revalidate=2592000"
}

resource "aws_s3_bucket_ownership_controls" "self" {
  bucket = aws_s3_bucket.self.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_public_access_block" "self" {
  bucket                  = aws_s3_bucket.self.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "self" {
  bucket = aws_s3_bucket.self.id
  policy = data.aws_iam_policy_document.bucket.json
}

data "aws_iam_policy_document" "bucket" {
  version = "2012-10-17"

  statement {
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:ListBucket",
    ]
    resources = [
      aws_s3_bucket.self.arn,
      "${aws_s3_bucket.self.arn}/*",
    ]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values = [
        aws_cloudfront_distribution.self.arn
      ]
    }
  }
}

resource "aws_cloudfront_distribution" "self" {
  comment         = local.distribution_comment
  enabled         = true
  is_ipv6_enabled = true
  price_class     = "PriceClass_All"
  aliases         = var.domains

  origin {
    domain_name              = aws_s3_bucket.self.bucket_regional_domain_name
    origin_id                = local.origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.self.id
  }

  default_cache_behavior {
    target_origin_id           = local.origin_id
    allowed_methods            = local.methods
    cached_methods             = local.methods
    cache_policy_id            = local.cache_policy_id
    response_headers_policy_id = local.response_headers_policy_id
    compress                   = true
    viewer_protocol_policy     = "redirect-to-https"

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.viewer_request.arn
    }
  }

  custom_error_response {
    error_code            = 404
    response_code         = 404
    response_page_path    = local.error_404_path
    error_caching_min_ttl = 60
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  dynamic "viewer_certificate" {
    for_each = length(var.domains) == 0 ? [1] : []

    content {
      cloudfront_default_certificate = true
    }
  }

  dynamic "viewer_certificate" {
    for_each = length(var.domains) > 0 ? [1] : []

    content {
      acm_certificate_arn      = var.certificate
      minimum_protocol_version = var.min_tls_version
      ssl_support_method       = "sni-only"
    }
  }

  tags = {
    SPA = var.name
  }
}

resource "aws_cloudfront_response_headers_policy" "self" {
  name    = local.response_headers_policy_name
  comment = local.response_headers_policy_comment

  security_headers_config {
    content_security_policy {
      content_security_policy = local.content_security_policy
      override                = true
    }

    content_type_options {
      override = true
    }

    frame_options {
      frame_option = "SAMEORIGIN"
      override     = true
    }

    referrer_policy {
      referrer_policy = "no-referrer"
      override        = true
    }

    strict_transport_security {
      access_control_max_age_sec = 31536000
      override                   = true
    }
  }

  remove_headers_config {
    items { header = "Server" }
    items { header = "X-Amz-Server-Side-Encryption" }
    items { header = "X-Amz-Storage-Class" }
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_cloudfront_function" "viewer_request" {
  name    = local.viewer_request_function_name
  comment = local.viewer_request_function_comment
  code    = local.viewer_request_code
  runtime = "cloudfront-js-2.0"
  publish = true

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_cloudfront_origin_access_control" "self" {
  name                              = local.origin_access_control_name
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"

  lifecycle {
    create_before_destroy = true
  }
}
