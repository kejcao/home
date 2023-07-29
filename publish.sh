#!/bin/bash

cd pub
git add -A
git commit --amend -m "Add post"
git push -f origin main
