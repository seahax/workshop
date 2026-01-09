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

(Required) Must be unique within your AWS account. It's used to generate the following resource names:

- S3 Bucket: `spa--<name>-<account>`
- CloudFront Origin Access Control: `spa--<name>`
- CloudFront Function: `spa--<name>-viewer-request`

### `region`
  
(Optional) The AWS region where the S3 bucket will be created. Default is `us-east-1`.

### `domains`

(Optional) List of custom domain names (aliases) to associate with the CloudFront distribution. If custom domains are used, you must also set the `certificate` variable.

### `certificate`

(Optional) ACM certificate ARN for custom domains. Required if `domains` is set. Must be in `us-east-1`. You must provision the certificate separately. A wildcard certificate (eg. `*.example.com`) is recommended so that it can be reused for other subdomains (same price and less overhead).

### `min_tls_version`

(Optional) Minimum TLS version for viewer connections. Only used if using custom domains. Default is `TLSv1.2_2021`.

### `error_404_path`

(Optional) Path to a custom 404 page.

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
