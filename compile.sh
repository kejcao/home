#!/bin/bash

python3 src/fun-websites/gen.py >src/fun-websites/index.html
npx tailwindcss -i src/input.css -o static/stylesheet.css --minify

node build.js $@
