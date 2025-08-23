#!/usr/bin/env bash
source .env.local
export APP_STATIC_PATH=./frontend/dist
export APP_ORIGIN=http://127.0.0.1:8080
node backend/dist/index.mjs "$@"
