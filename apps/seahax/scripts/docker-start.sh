#!/usr/bin/env bash
source .env.local
docker run -it --rm --network=host \
  -e APP_ORIGIN=http://127.0.0.1:8080 \
  -e APP_DATABASE_URL="${APP_DATABASE_URL}" \
  -e APP_PEPPER="${APP_PEPPER}" \
  app-seahax-backend \
  "$@"
