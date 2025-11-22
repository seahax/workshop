#!/usr/bin/env bash
set -e
[ -z "$npm_package_name" ] && echo "npm_package_name is not set" && exit 1
docker run -it --rm \
  -e APP_ORIGIN=http://127.0.0.1:8080 \
  -e APP_MONGODB_URL="${APP_MONGODB_URL}" \
  -e APP_ENVIRONMENT=development \
  -p 8080:8080 \
  "$npm_package_name" \
  "$@"
