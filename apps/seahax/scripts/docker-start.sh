#!/usr/bin/env bash
set -e
[ -z "$npm_package_name" ] && echo "npm_package_name is not set" && exit 1
docker run -it --rm \
  -e APP_ORIGIN=http://127.0.0.1:8080 \
  -e APP_DATABASE_URL="${APP_DATABASE_URL}" \
  -p 8080:8080 \
  "$npm_package_name" \
  "$@"
