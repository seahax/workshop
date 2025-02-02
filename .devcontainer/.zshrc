# When: On new interactive shells (non-login, unless sourced by .zprofile)
# For:
#   - Aliases
#   - Functions
#   - Prompt Config
#   - Things that are not inherited by child shells

export ZSH="$HOME/.oh-my-zsh"

zstyle ':omz:update' mode auto
zstyle ':omz:update' frequency 31

ZSH_THEME=devcontainers
DISABLE_UNTRACKED_FILES_DIRTY=true
DISABLE_MAGIC_FUNCTIONS=true
DISABLE_AUTO_TITLE=true
plugins=(git asdf aws vscode)

source $ZSH/oh-my-zsh.sh

alias g=git
alias n=npm
alias p=pnpm

for file in "$HOME/.zshrc.d/*.zsh"(N); do
  source "$file"
done
