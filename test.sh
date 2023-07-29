#!/bin/bash

cd pub && python3 -m http.server &
while sleep 0.2; do
  find * | entr -d sh -c 'notify-send -u low -t 500 compiling && ./compile.sh && notify-send -t 2000 finished || notify-send -t 2000 -u critical failed'
done
