#!/bin/bash

error() {
    echo "home: $*"
    exit 1
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

        [ ! -f "$2" ] && error "image file doesn't exist"
        [ -f "$out" ] && error "image already exists"
        [ "${2##*.}" != "png" ] && error 'image file should be png'

        confirm "save as $(basename "$out")"
        cp "$2" "$out"

        cd "$root/images" || error "cd fails"
        ./compile.sh

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
    'help')
        echo '       ls - list all posts'
        echo '     edit - edit an post'
        echo '   latest - edit latest post'
        echo 'add-image - add an image'
        ;;
    *)
        error "no subcommand given; try help?"
        ;;
esac
