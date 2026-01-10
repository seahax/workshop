# SPA Terraform Module

This module provisions S3 and CloudFront resources to serve an SPA (Single Page Application).

## Getting Started

Use this module in your Terraform configuration as follows:

```hcl
module "spa" {
  source = "github.com/seahax/terraform/spa"
  name = "my-spa"
}
```

## Inputs

### `name`

(Required) Must be unique within your AWS account. Used to generate resource names and tags.

### `region`
  
(Optional) S3 bucket region. Default is `us-east-1`.

### `router`

(Optional) Custom JavaScript string that defines a `router` function to rewrite request paths to S3 origin paths.

The `router` function is given the request path. It can return a new path (rewrite) or a falsy value (no rewrite). Generally, it should rewrite SPA route paths to HTML files in the S3 bucket. Using a custom router overrides the default SPA router behavior.

Must be compatible with CloudFront function JavaScript runtime 2.0.

### `viewer_response_function_arn`

(Optional) ARN of a Cloudfront function to associate with viewer response event.

### `domains`

(Optional) List of aliases (custom domain names) for the Cloudfront distribution. If non-empty, `certificate` is required.

### `certificate`

(Optional) ACM certificate ARN to use for the Cloudfront distribution. Required when using custom domains. Must be in us-east-1.

### `min_tls_version`

(Optional) Minimum TLS version for viewer connections. Only used if using custom domains. Default is `TLSv1.2_2021`.

### `error_404_path`

(Optional) Path to a custom 404 page. Must begin with a leading slash (`/`).

### `cache_policy_id`

(Optional) Override the default CloudFront cache policy ID.

### `response_headers_policy_id`

(Optional) Override the default CloudFront response headers policy ID.

### `force_destroy`

(Optional) Set to `true` to allow the destruction of the S3 bucket and its contents. Default is `false`. Before running `terraform destroy`, you either must set this to `true`, or remove the bucket from the state (eg. `terraform state rm module.<module_name>.aws_s3_bucket.self`).

## Outputs

### `bucket_name`

The name of the S3 bucket used as the CloudFront origin.

Use the `aws` CLI or SDKs to upload content to this bucket. Setting appropriate `Cache-Control` headers and using the `INTELLIGENT_TIERING` storage class is recommended for cost optimization.

Example: Use the CLI to upload immutable assets (eg. hashed bundle files).

```bash
aws s3 cp dist "s3://$(terraform output -raw bucket_name)" \
  --recursive \
  --exclude "*" \
  --include "assets/*" \
  --cache-control "public, max-age=31536000, immutable" \
  --storage-class INTELLIGENT_TIERING
```

> NOTE: It's generally a good idea to upload immutable assets first, before updating frequently changing assets like `index.html` that may reference them.

Example: Use the CLI to upload frequently changing assets (eg. `index.html`).

```bash
aws s3 cp dist "s3://$(terraform output -raw bucket_name)" \
  --recursive \
  --exclude "assets/*" \
  --cache-control "public, max-age=60, stale-while-revalidate=2592000" \
  --storage-class INTELLIGENT_TIERING
```

### `distribution_id`

The ID of the CloudFront distribution.

If you need to invalidate the cache, you can use this ID with the AWS CLI or SDKs.

Example: Invalidate all cached content.

```bash
aws cloudfront create-invalidation \
  --distribution-id "$(terraform output -raw distribution_id)" \
  --paths "/*"
```

### `distribution_domain`

The default domain name of the CloudFront distribution.

If you're using custom domains, create CNAME or ALIAS records pointing to this domain.
