#!/usr/bin/env bash
set -e
[ -z "$npm_package_name" ] && echo "npm_package_name is not set" && exit 1
docker network create seahax || true
docker run -it --rm \
  --name seahax-app \
  --network seahax \
  -p 8080:8080 \
  -e APP_ENVIRONMENT=development \
  -e APP_MONGODB_URL="mongodb://root:${MONGO_ROOT_PASSWORD}@seahax-mongodb:27017/admin?authSource=admin" \
  -e APP_SMTP_SERVER="${APP_SMTP_SERVER}" \
  -e APP_SMTP_PORT="${APP_SMTP_PORT}" \
  -e APP_SMTP_USERNAME="${APP_SMTP_USERNAME}" \
  -e APP_SMTP_TOKEN="${APP_SMTP_TOKEN}" \
  -e APP_LOG_LEVEL="${APP_LOG_LEVEL}" \
  "$npm_package_name" \
  "$@"
