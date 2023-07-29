#!/bin/bash

OUT=~/home/static/media
for fp in *.{gif,svg,png}; do
  case "$fp" in
    *.png) ffmpeg -y -i "$fp" "$OUT/${fp%.*}.jpg" ;;
    *) cp "$fp" "$OUT/$fp" ;;
  esac
done
