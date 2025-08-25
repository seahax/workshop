#!/usr/bin/env bash
export APP_HOSTNAME=127.0.0.1
export APP_PORT=8080
export APP_STATIC_PATH=./frontend/dist
export APP_ORIGIN=http://127.0.0.1:8080
source .env.local
node backend/dist/index.mjs "$@"
