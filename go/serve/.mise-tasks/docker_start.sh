#!/usr/bin/env bash
set -ex
mise docker_build
docker run -it --rm -p 8080:8080 "$@" seahax.com/serve:latest
