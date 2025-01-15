#!/usr/bin/env bash
set -e
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

(
  echo "Copying dotfiles..."
  mkdir -p "$HOME/.dotfiles"
  cd "$HOME/.dotfiles"
  git clone "${GITHUB_SERVER_URL}/${GITHUB_USER}/devcontainer-dotfiles" .
  rm -rf .git

  if [ -f setup.sh ]; then
    bash setup.sh
    exit
  fi

  cp -rfv . ~
) || echo "Failed to copy dotfiles."

npm i -g npm@latest
npm i -g corepack
corepack enable
pnpm install
