#!/bin/bash

cd pub
rm -r *
cp -r ../build/* .
git add -A
git commit --amend -m "Add post"
git push -f origin main
