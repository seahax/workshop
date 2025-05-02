#!/usr/bin/env bash
export APP_STATIC_PATH=../frontend/dist
export APP_ORIGIN='http://127.0.0.1:8080'
export APP_DATABASE_URL='mongodb://127.0.0.1:27017'
export APP_PEPPER=LocalPepper
node $(dirname "$0")/../dist/index.mjs "$@"
