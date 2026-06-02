export function generateHook() {
  return `
# snapback-cli shell hook
# Add this to your .zshrc or .bashrc:
#   eval "$(snapback hook)"

snapback_cd() {
  builtin cd "$@" && snapback _auto-save 2>/dev/null &
}

if [ -n "$ZSH_VERSION" ]; then
  # zsh
  snapback_chpwd() {
    snapback _auto-save 2>/dev/null &
  }
  autoload -Uz add-zsh-hook
  add-zsh-hook chpwd snapback_chpwd
else
  # bash
  alias cd='snapback_cd'
fi
`.trimStart();
}
