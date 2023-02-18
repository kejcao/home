#!/bin/bash

node build.js && rm -r pub/* && cp -r build/* static/* pub/
