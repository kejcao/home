#!/bin/bash

cd pub && python3 -m http.server &
while sleep 0.2; do
  # find src/* | grep '\.\(html\|md\)$' | entr -d sh -c './compile.sh && notify-send finished || notify-send -u critical failed'
  find src/* | entr -d sh -c './compile.sh && notify-send -t 2000 finished || notify-send -t 2000 -u critical failed'
done
