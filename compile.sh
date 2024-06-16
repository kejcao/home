#!/bin/bash

node build.js "$@"

cd build || exit
rm -r static
cp -r ../static .
