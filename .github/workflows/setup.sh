#!/usr/bin/env bash
export ASDF_DATA_DIR=$HOME/.asdf
export ASDF_DIR=$ASDF_DATA_DIR/bin
export PATH="$ASDF_DATA_DIR/shims:$ASDF_DIR:$PATH"

echo "$ASDF_DATA_DIR/shims" >> "$GITHUB_PATH"
echo "$ASDF_DIR" >> "$GITHUB_PATH"

mkdir -p "$ASDF_DIR"
wget -q https://github.com/asdf-vm/asdf/releases/download/v0.16.0/asdf-v0.16.0-linux-amd64.tar.gz -P "$ASDF_DIR"
tar -xvf "$ASDF_DIR/asdf-v0.16.0-linux-amd64.tar.gz" -C "$ASDF_DIR"

asdf plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git
asdf plugin add pnpm https://github.com/jonathanmorley/asdf-pnpm.git
asdf plugin add golang https://github.com/asdf-community/asdf-golang.git
asdf install

node -v
pnpm -v
go version
