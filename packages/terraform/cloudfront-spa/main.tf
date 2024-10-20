terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

variable "domain_name" {
  type = string
}

variable "aliases" {
  type    = list(string)
  default = []
}

variable "acm_certificate_arn" {
  type = string
}

locals {
  aliases = concat([var.domain_name], var.aliases)
}

module "bucket" {
  source = "../s3-bucket"
  bucket = var.domain_name
  expiration = {
    "legacy/" = 366
  }
}

module "self" {
  source  = "terraform-aws-modules/cloudfront/aws"
  version = "3.4.1"

  price_class     = "PriceClass_100"
  http_version    = "http2and3"
  is_ipv6_enabled = true

  aliases = local.aliases

  viewer_certificate = {
    acm_certificate_arn      = var.acm_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2019"
  }

  default_root_object = "index.html"
  custom_error_response = [
    {
      error_code         = 403
      response_code      = 200
      response_page_path = "/index.html"
    },
    {
      error_code         = 404
      response_code      = 200
      response_page_path = "/index.html"
    },
  ]

  create_origin_access_control = true
  origin_access_control = {
    "${var.domain_name}--s3" = {
      description      = "CloudFront access to S3"
      origin_type      = "s3"
      signing_behavior = "always"
      signing_protocol = "sigv4"
    }
  }

  origin = {
    current = {
      domain_name           = module.bucket.regional_domain_name
      origin_path           = "/current"
      origin_access_control = "${var.domain_name}--s3"
    }
    legacy = {
      domain_name           = module.bucket.regional_domain_name
      origin_path           = "/legacy"
      origin_access_control = "${var.domain_name}--s3"
    }
  }

  origin_group = {
    spa = {
      failover_status_codes      = [403, 404]
      primary_member_origin_id   = "current"
      secondary_member_origin_id = "legacy"
    }
  }

  default_cache_behavior = {
    target_origin_id           = "spa"
    viewer_protocol_policy     = "redirect-to-https"
    compress                   = true
    use_forwarded_values       = false
    cache_policy_id            = "658327ea-f89d-4fab-a63d-7e88639e58f6" // Managed CacheOptimized
    response_headers_policy_id = "e61eb60c-9c35-4d20-a928-2b84e02af89c" // Managed CORS-and-SecurityHeadersPolicy
  }
}

data "aws_iam_policy_document" "this" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${module.bucket.arn}/*"]
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [module.self.cloudfront_distribution_arn]
    }
  }
}

resource "aws_s3_bucket_policy" "this" {
  bucket = module.bucket.id
  policy = data.aws_iam_policy_document.this.json
}

output "id" {
  value = module.self.cloudfront_distribution_id
}

output "route53_alias" {
  value = {
    name    = module.self.cloudfront_distribution_domain_name,
    zone_id = module.self.cloudfront_distribution_hosted_zone_id
  }
}
