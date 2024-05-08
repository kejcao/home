#!/bin/bash

./css.sh

node build.js "$@"

cd build || exit
rm -r static
cp -r ../static .
