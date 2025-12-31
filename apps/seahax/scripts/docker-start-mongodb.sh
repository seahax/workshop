#!/usr/bin/env bash
set -e
docker network create seahax || true
docker run -it --rm \
  --name seahax-mongodb \
  --network seahax \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD="$MONGO_ROOT_PASSWORD" \
  mongo
