#!/usr/bin/env bash
set -e
unset LS_COLORS
export NO_COLOR=1
export TERM=xterm
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
export NVM_DIR="$HOME/.nvm"

cd "$(dirname "$0")"

# Install system packages.
sudo apt-get update
sudo apt-get install -y vim awscli

# Install NVM and NodeJS LTS version.
git clone https://github.com/nvm-sh/nvm.git "$NVM_DIR"
cd "$NVM_DIR"
git checkout $(git describe --abbrev=0 --tags --match "v[0-9]*" $(git rev-list --tags --max-count=1))
. "$NVM_DIR/nvm.sh"
nvm install --lts

# Install global NPM packages.
[ -f "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
npm i -g npm@latest corepack@latest
corepack enable

# Update the ZSH config.
cat <<EOF >>"$HOME/.zshrc"

# Added by "$0"

export NVM_DIR=$NVM_DIR
export COREPACK_ENABLE_DOWNLOAD_PROMPT=$COREPACK_ENABLE_DOWNLOAD_PROMPT
export PNPM_HOME=\$HOME/.local/share/pnpm
export PATH=\$PNPM_HOME:\$PATH

[ -f "\$NVM_DIR/nvm.sh" ] && . "\$NVM_DIR/nvm.sh"

alias g=git
alias n=npm
alias p=pnpm
EOF
