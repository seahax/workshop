# When: On login (interactive)
# For:
#   - Global environment variables (eg. PATH, EDITOR, etc.)
#   - Things that are inherited by child shells

export LANG=en_US.UTF-8
export EDITOR=vim
export AWS_REGION=us-west-2
export NODE_OPTIONS="$NODE_OPTIONS --no-deprecation"
export PNPM_HOME=$HOME/.pnpm

path=(
  $HOME/bin
  $HOME/.local/bin
  $HOME/.asdf/shims
  $PNPM_HOME
  $path
)

mkdir -p "$HOME/bin"
mkdir -p "$HOME/.local/bin"
mkdir -p "$HOME/.asdf/shims"
mkdir -p "$PNPM_HOME"

for file in "$HOME/.zprofile.d/*.zsh"(N); do
  source "$file"
done

source "$HOME/.zshrc"
