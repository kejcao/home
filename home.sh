#!/bin/bash

set -e

error() {
    echo "home: $*"
    exit 1
}

nvm() {
  unset -f nvm
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
  [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
  nvm "$@"
}

confirm() {
    while :; do
        read -n1 -rp "$*? (y/n) " ans && echo
        case $ans in
            'y') break ;;
            'n')  exit ;;
        esac
    done
}

ls-posts() {
    for p in "$root"/src/posts/*; do
        [ ! -d "$p" ] && {
            date=$(head -1 "$p" | cut -d\| -f3 | tr -d ' ')
            p=$(basename "$p")
            echo "$date ${p%%.*}"
        }
    done | sort -t '-' -k 1,1 -k 2,2 -k 3,3
}

root='/home/kjc/home'

case $1 in
    'add-image')
        out=$([ -n "$3" ] \
            && echo "$root/images/$3.png" \
            || echo "$root/images/$(basename "$2")"
        )

        [ ! -f "$2" ] && error "src image file doesn't exist"
        [ -f "$out" ] && error "image already exists"

        [ "${2##*.}" != "jpg" ] && \
        [ "${2##*.}" != "gif" ] && \
        [ "${2##*.}" != "svg" ] && \
            error 'unsupported image file format'

        confirm "save as $(basename "$out")"
        cp "$2" "$out"

        cp $root/images/* $root/pub/static/media
        ;;
    'ls')
        ls-posts
        ;;
    'latest')
        $EDITOR "$root/src/posts/$(ls-posts | tail -1 | cut -c12-).md"
        ;;
    'edit')
        out="$root/src/posts/$2.md"

        if [ ! -f "$out" ]; then
            confirm 'create new post'
            cat <<EOF >"$out"
Untitled | 1 | $(date -Idate) | tags

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce tempus pellentesque luctus. Donec at orci nibh. Aliquam erat volutpat. Donec pharetra feugiat tincidunt. Maecenas ornare egestas orci a tincidunt. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Ut dapibus placerat mollis. Quisque et leo et erat sagittis pulvinar eu sit amet justo. Cras quis bibendum libero. Etiam imperdiet egestas mi in venenatis. Duis fringilla cursus libero, sed volutpat purus gravida a. Interdum et malesuada fames ac ante ipsum primis in faucibus. Aenean mi risus, varius sed vehicula vitae, efficitur gravida mauris. Donec id dolor sodales, convallis ipsum sed, ultricies mauris. Mauris nec pretium lorem, ut laoreet sem. Donec eget risus laoreet, pellentesque risus et, dictum purus.
EOF
        fi

        $EDITOR "$out"
        ;;
    'dev')
        cd $root
        nvm use v22.1.0
        npm run dev
        ;;
    'compile')
        cd $root
        node build.js
        ;;
    'publish')
        cd $root
        node build.js dev=false

        cd pub
        git add -A
        git commit --amend -m "Add post"
        git push -f origin main
        ;;
    *)
        echo '       ls - list all posts'
        echo '     edit - edit an post'
        echo '   latest - edit latest post'
        echo '  publish - publish website'
        echo '  compile - recompile entire website'
        echo 'add-image [src] [dest] - add an image'
        ;;
esac
