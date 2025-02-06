FROM mcr.microsoft.com/devcontainers/base:ubuntu
ARG TARGETARCH

RUN apt-get update
RUN apt-get install -y git vim awscli
RUN chsh -s /usr/bin/zsh vscode

COPY content /.temp-content
USER vscode
RUN zsh /.temp-content/setup.zsh "$TARGETARCH"
USER root
RUN rm -rf /.temp-content
