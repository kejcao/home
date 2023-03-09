#!/bin/bash

cd pub && python3 -m http.server &
while :; do
	./compile.sh
	read -n 1
done
