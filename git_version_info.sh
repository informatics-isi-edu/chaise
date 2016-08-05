#!/usr/bin/env bash

# checks if branch has something pending
function parse_git_dirty() {
  git diff --quiet --ignore-submodules HEAD 2>/dev/null; [ $? -eq 1 ] && echo "*"
}

# gets the current git branch
function parse_git_branch() {
  git branch --no-color 2> /dev/null | sed -e '/^[^*]/d' -e "s/* \(.*\)/\1$(parse_git_dirty)/"
}

# get last commit message with author and date
function parse_git_hash() {
  git log -1
}

VERSION=version.txt
DATE=$(date)

TITLE="**************************CHAISE BUILD INFO******************************\n\nBUILD DATE : "$DATE

CHAISECOMMIT=$(parse_git_branch)"\n"$(parse_git_hash)

cd ../ermrestjs

ERMRESTJSCOMMIT=$(parse_git_branch)"\n"$(parse_git_hash)

cd ../ermrest

ERMRESTCOMMIT=$(parse_git_branch)"\n"$(parse_git_hash)

cd ../chaise
echo $TITLE"\n\nCHAISE : "$CHAISECOMMIT"\n\nEMRESTJS : "$ERMRESTJSCOMMIT"\n\nEMREST : "$ERMRESTCOMMIT> $VERSION