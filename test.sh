#!/bin/bash

./compile.sh
cd pub && python3 -m http.server
