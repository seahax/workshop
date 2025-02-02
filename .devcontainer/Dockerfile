FROM mcr.microsoft.com/devcontainers/base:ubuntu

RUN apt-get update
RUN apt-get install -y git vim awscli

USER vscode

ENV HOME=/home/vscode
ENV PATH=$HOME/.asdf/shims:$HOME/bin:$PATH

WORKDIR $HOME

COPY .zprofile .
COPY .zshrc .

RUN wget https://github.com/asdf-vm/asdf/releases/download/v0.16.0/asdf-v0.16.0-linux-arm64.tar.gz
RUN mkdir -p bin
RUN tar -xvf asdf-v0.16.0-linux-arm64.tar.gz -C bin
RUN asdf plugin add nodejs https://github.com/asdf-vm/asdf-nodejs.git
RUN asdf plugin add pnpm https://github.com/jonathanmorley/asdf-pnpm.git
RUN asdf plugin add golang https://github.com/asdf-community/asdf-golang.git
