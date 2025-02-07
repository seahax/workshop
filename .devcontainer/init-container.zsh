#!/usr/bin/env zsh
export ARCH=$1

cd ~
source .zprofile

(
  wget "https://github.com/asdf-vm/asdf/releases/download/v0.16.0/asdf-v0.16.0-linux-$ARCH.tar.gz"
  tar -xvf "asdf-v0.16.0-linux-$ARCH.tar.gz" -C bin
  rm "asdf-v0.16.0-linux-$ARCH.tar.gz"
  asdf plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git
  asdf plugin add pnpm https://github.com/jonathanmorley/asdf-pnpm.git
  asdf plugin add golang https://github.com/asdf-community/asdf-golang.git
  asdf install
)

npm i -g npm@latest
