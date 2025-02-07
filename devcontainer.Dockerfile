FROM mcr.microsoft.com/devcontainers/base:ubuntu
ARG TARGETARCH

# Configure the system.
RUN apt-get update
RUN apt-get install -y vim git awscli
RUN chsh -s /usr/bin/zsh vscode

# Install dotfiles.
COPY .devcontainer/dotfiles /home/vscode
COPY .tool-versions /home/vscode/.tool-versions
RUN chown -R vscode:vscode /home/vscode

# Initialize the workspace.
USER vscode
COPY .devcontainer/init-container.zsh /tmp/.devcontainer/init-container.zsh
RUN zsh /tmp/.devcontainer/init-container.zsh "$TARGETARCH"
