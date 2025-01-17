#!/usr/bin/env bash
set -e
unset LS_COLORS
export NO_COLOR=1
export TERM=xterm
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

sudo apt-get update
sudo apt-get install -y vim awscli gawk

git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.15.0
. ~/.asdf/asdf.sh
asdf plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git

cat "$(dirname "$0")/.zshrc" >> ~/.zshrc
