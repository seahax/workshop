#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

SOURCE=../../apps/seahax/frontend/dist
BUCKET_NAME=$(terraform output -raw bucket_name)
DISTRIBUTION_ID=$(terraform output -raw distribution_id)

aws s3 cp "$SOURCE" "s3://$BUCKET_NAME" \
  --recursive \
  --exclude "*" \
  --include "assets/*" \
  --cache-control "public, max-age=31536000, immutable" \
  --storage-class INTELLIGENT_TIERING

aws s3 cp "$SOURCE" "s3://$BUCKET_NAME" \
  --recursive \
  --exclude "assets/*" \
  --cache-control "public, max-age=60, stale-while-revalidate=2592000" \
  --storage-class INTELLIGENT_TIERING

aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/index.html"
