FROM mcr.microsoft.com/devcontainers/base:ubuntu
ARG TARGETARCH

# Configure the system.
RUN apt-get update
RUN yes | /usr/local/sbin/unminimize
RUN apt-get install -y git vim awscli
RUN chsh -s /usr/bin/zsh vscode

# Install dotfiles.
COPY .devcontainer/dotfiles /home/vscode
COPY .tool-versions /home/vscode/.tool-versions
RUN chown -R vscode:vscode /home/vscode

# Initialize the workspace.
USER vscode
COPY .devcontainer/init-container.zsh /tmp/.devcontainer/init-container.zsh
RUN zsh /tmp/.devcontainer/init-container.zsh "$TARGETARCH"
