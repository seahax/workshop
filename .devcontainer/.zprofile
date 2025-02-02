# When: On login (interactive)
# For:
#   - Global environment variables (eg. PATH, EDITOR, etc.)
#   - Things that are inherited by child shells

path=(
  $HOME/bin
  $HOME/.local/bin
  $PNPM_HOME
  $HOME/.asdf/shims
  $path
)

export LANG=en_US.UTF-8
export EDITOR=vim
export AWS_REGION=us-west-2
export NODE_OPTIONS="$NODE_OPTIONS --no-deprecation"
export PNPM_HOME=$HOME/.pnpm

mkdir -p "$PNPM_HOME"

for file in "$HOME/.zprofile.d/*.zsh"(N); do
  source "$file"
done

source "$HOME/.zshrc"
