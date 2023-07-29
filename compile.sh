#!/bin/bash

cd src/recent-reads
python3 gen.py >index.html
cd -
npx tailwindcss -i src/input.css -o static/stylesheet.css --minify
node build.js $@ && rm -r pub/* && cp -r build/* static/* pub/
