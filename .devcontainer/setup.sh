#!/usr/bin/env bash
set -e
unset LS_COLORS
export NO_COLOR=1
export TERM=xterm

(
  if [ -z "$GITHUB_USER" ]; then
    echo "GITHUB_USER is not set."
    exit 1
  fi

  export DEVCONTAINER_DOTFILES_CLONE_DIR="$HOME/.devcontainer-dotfiles"
  
  echo "Copying dotfiles..."
  rm -rf "$DEVCONTAINER_DOTFILES_CLONE_DIR"
  mkdir -p "$DEVCONTAINER_DOTFILES_CLONE_DIR"
  git clone \
    "${GITHUB_SERVER_URL:-https://github.com}/$GITHUB_USER/devcontainer-dotfiles" \
    "$DEVCONTAINER_DOTFILES_CLONE_DIR"

  if [ -f "$DEVCONTAINER_DOTFILES_CLONE_DIR/setup.sh" ]; then
    ( cd "$DEVCONTAINER_DOTFILES_CLONE_DIR"; bash setup.sh )
    exit
  fi

  rsync -arv "$DEVCONTAINER_DOTFILES_CLONE_DIR/" "$HOME/" --exclude ".git"
) || echo "Failed to copy dotfiles."

if [ -f "${HOME}/.profile" ]; then
  source "${HOME}/.profile"
fi

export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

npm i -g npm@latest
npm i -g corepack
corepack enable
pnpm install
