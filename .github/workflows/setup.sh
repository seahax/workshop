#!/usr/bin/env bash
set -e
set -x
export PATH="$HOME/bin:$PATH"
export PATH="$HOME/.asdf/bin:$PATH"

OLD_PATHS=$(cat "$GITHUB_PATH")
NEW_PATHS=<<EOF
$HOME/bin
$HOME/.asdf/bin
$OLD_PATHS
EOF
echo "$PATHS" > "$GITHUB_PATH"
cat "$GITHUB_PATH"

wget https://github.com/asdf-vm/asdf/releases/download/v0.16.0/asdf-v0.16.0-linux-amd64.tar.gz -P "$HOME"

mkdir -p "$HOME/bin"
tar -xvf "$HOME/asdf-v0.16.0-linux-amd64.tar.gz" -C "$HOME/bin"

asdf plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git
asdf plugin add pnpm https://github.com/jonathanmorley/asdf-pnpm.git
asdf plugin add golang https://github.com/asdf-community/asdf-golang.git
asdf install

node -v
pnpm -v
golang version
