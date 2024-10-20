#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
export AWS_PROFILE=seahax

terraform -chdir=terraform init
terraform -chdir=terraform apply
CFID=$(terraform -chdir=terraform output -raw cloudfront_id)

aws s3 sync s3://notes.seahax.com/current s3://notes.seahax.com/legacy
aws s3 sync dist s3://notes.seahax.com/current --delete
aws cloudfront create-invalidation --distribution-id "$CFID" --paths '/*' >/dev/null
