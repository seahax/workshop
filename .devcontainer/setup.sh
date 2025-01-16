#!/usr/bin/env bash
set -e
unset LS_COLORS
export NO_COLOR=1
export TERM=xterm
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
npm i -g npm@latest
npm i -g corepack
corepack enable
pnpm install
