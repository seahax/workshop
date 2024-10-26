#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
export AWS_PROFILE=seahax

if [ ! -f out/dist.zip ]; then
  echo "Missing out/dist.zip file." 2>&1
  exit 1
fi

terraform -chdir=terraform init
terraform -chdir=terraform apply
