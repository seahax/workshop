output "bucket_name" {
  description = "The name of the S3 bucket used as the origin for the CDN."
  value       = aws_s3_bucket.self.bucket
}

output "distribution_domain" {
  description = "The default domain name of the Cloudfront distribution."
  value       = aws_cloudfront_distribution.self.domain_name
}

output "distribution_id" {
  description = "The ID of the Cloudfront distribution."
  value       = aws_cloudfront_distribution.self.id
}

