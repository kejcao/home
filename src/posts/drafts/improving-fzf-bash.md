Improving fzf in Bash | 3 | 2023-09-23 | fzf,bash

[fzf](https://github.com/junegunn/fzf) is a command line tool to fuzzy search files and is a really useful tool for efficiently navigating the filesystem in a terminal. As opposed to running something like "`find | grep file`" fzf offers an interactive interface and can ignore most typos–it's essentially like Google searching for your files, if Google indexed your filenames instead of webpages.

It can be integrated with Bash by sourcing a couple scripts in your `.bashrc`. It adds a few keybindings:

- `!Ctrl+T` to launch fzf and insert the path you pick at your cursor.
- `!Alt+C` to launch fzf and `cd`s into the directory you pick.

I also add default options that bind some keys to scroll through the preview window fzf sometimes shows.

```bash
export FZF_DEFAULT_OPTS='--bind ctrl-u:preview-half-page-up,ctrl-d:preview-half-page-down'
. /usr/share/fzf/key-bindings.bash
. /usr/share/fzf/completion.bash
```

It looks like this

!fzf-bash-file-completion-demo.gif

I like to use it as a supplement to native Bash completion. By default, if one presses tab after double asterisks o

```bash
__fzf_select__() {
  local cmd opts
  cmd="${FZF_CTRL_T_COMMAND:-"command find -L . -mindepth 1 \\( -path '*/\\.*' -o -fstype 'sysfs' -o -fstype 'devfs' -o -fstype 'devtmpfs' -o -fstype 'proc' \\) -prune \
    -o -type f -print \
    -o -type d -print \
    -o -type l -print 2> /dev/null | cut -b3-"}"
  opts="--height ${FZF_TMUX_HEIGHT:-40%} --bind=ctrl-z:ignore --reverse ${FZF_DEFAULT_OPTS-} ${FZF_CTRL_T_OPTS-} -m"
  eval "$cmd" |
    FZF_DEFAULT_OPTS="$opts" $(__fzfcmd) "$@" |
    while read -r item; do
      printf '%q ' "$item"  # escape special chars
    done
}

fzf-file-widget() {
  local selected="$(__fzf_select__ "$@")"
  READLINE_LINE="${READLINE_LINE:0:$READLINE_POINT}$selected${READLINE_LINE:$READLINE_POINT}"
  READLINE_POINT=$(( READLINE_POINT + ${#selected} ))
}
```


```bash
# should receive single parameter representing user input
__fzf_select__() {
  file=$(basename "$@")
  (
    [ -d "$@" ] \
      && fd --base-directory "$@" \
      || (
        cd "$(dirname "$@")"
        for f in "$file"*; do
          [ -d "$f" ] && fd . "$f" || echo "$f"
        done
      )
  ) | fzf |
    while read -r item; do
      printf '%q ' "${item:$(
        [ -d "$@" ] \
          && echo 0 \
          || echo ${#file}
      )}"
    done
}

lastarg() { echo ${@: -1}; }
fzf-file-widget() {
  txt=${READLINE_LINE:0:$READLINE_POINT}
  local selected=$(__fzf_select__ "$(
    [ "${txt: -1}" == ' ' ] \
      && echo '.' \
      || echo "$(lastarg $txt)"
  )")
  READLINE_LINE="${READLINE_LINE:0:$READLINE_POINT}$selected${READLINE_LINE:$READLINE_POINT}"
  READLINE_POINT=$(( READLINE_POINT + ${#selected} ))
}
```


