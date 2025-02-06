FROM mcr.microsoft.com/devcontainers/base:ubuntu
ARG TARGETARCH

# Configure the system.
RUN apt-get update
RUN apt-get install -y git vim awscli
RUN chsh -s /usr/bin/zsh vscode

# Install dotfiles.
COPY dotfiles /home/vscode
RUN chown -R vscode:vscode /home/vscode

# Do user setup.
COPY scripts/create.zsh /tmp/.devcontainer/scripts/create.zsh
USER vscode
RUN zsh /tmp/.devcontainer/scripts/create.zsh "$TARGETARCH"

# Cleanup temporary files.
USER root
RUN rm -rf /tmp/.devcontainer
