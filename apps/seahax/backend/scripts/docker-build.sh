#!/usr/bin/env bash
[ -z "$npm_package_name" ] && echo "npm_package_name is not set" && exit 1
docker build ../ -t "$npm_package_name" \
  --build-arg APP_COMMIT="$(git rev-parse --short HEAD)" \
  --build-arg APP_BUILD_TIMESTAMP="$(date +%s)" \
  "$@"