#!/usr/bin/env zsh
export ARCH=$1

# Change to the home directory and pretend to be a login shell.
cd ~ && source .zprofile

(
  # Install asdf (from binary).
  wget "https://github.com/asdf-vm/asdf/releases/download/v0.16.0/asdf-v0.16.0-linux-$ARCH.tar.gz"
  tar -xvf "asdf-v0.16.0-linux-$ARCH.tar.gz" -C bin
  rm "asdf-v0.16.0-linux-$ARCH.tar.gz"

  # Install asdf plugins.
  asdf plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git
  asdf plugin add pnpm https://github.com/jonathanmorley/asdf-pnpm.git
  asdf plugin add golang https://github.com/asdf-community/asdf-golang.git

  # Install asdf managed tools.
  # ---
  # The Dockerfile should have copied the workspace .tool-versions file to the
  # container home directory (global defaults). Installing tools in the image
  # before VSCode starts helps avoid missing tool warnings.
  asdf install
)
