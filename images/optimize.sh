#!/bin/dash

mkdir tmp 2>/dev/null
svgo -f . -o tmp && cp tmp/* .
rm -r tmp
