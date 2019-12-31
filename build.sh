#!/bin/bash

# $0 : project base path

echo start execute build.sh
echo build.sh - deploy path : $1

cd $1;
git pull;
