#!/usr/bin/env bash
set -e

export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

npm i -g npm@latest
npm i -g corepack
corepack enable
pnpm install
