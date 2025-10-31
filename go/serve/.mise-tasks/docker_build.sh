#!/usr/bin/env bash
set -ex
mise build
docker build -t seahax.com/serve:latest "$@" .
