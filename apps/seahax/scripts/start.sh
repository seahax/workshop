#!/usr/bin/env bash
source .env.local
./api/dist/api "$@"
