#!/usr/bin/env bash
set -ex
rm -rf dist/serve
GOOS=linux CGO_ENABLED=0 go build -o dist/serve "$@" .
