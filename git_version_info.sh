#!/bin/sh

# checks if branch has something pending
parse_git_dirty() {
  git diff --quiet --ignore-submodules HEAD 2>/dev/null; [ $? -eq 1 ] && echo "*"
}

# gets the current git branch
parse_git_branch() {
  git branch --no-color 2> /dev/null | sed -e '/^[^*]/d' -e "s/* \(.*\)/\1$(parse_git_dirty)/"
}

# get last commit message with author and date
parse_git_hash() {
  git log -1
}

VERSION=version.txt
DATE=$(date)

TITLE="**************************CHAISE BUILD INFO******************************\n\nBUILD DATE : "$DATE

CHAISECOMMIT="\n\nCHAISE : $(parse_git_branch)\n$(parse_git_hash)"

cd ../ermrestjs

ERMRESTJSCOMMIT="\n\nEMRESTJS : $(parse_git_branch)\n$(parse_git_hash)"


if [ -n "$TRAVIS"]
then
cd ../ermrest
ERMRESTCOMMIT="\n\nEMREST : $(parse_git_branch)\n$(parse_git_hash)"
else
ERMRESTCOMMIT=""
fi

cd ../chaise
echo "${TITLE}${CHAISECOMMIT}${ERMRESTJSCOMMIT}${ERMRESTCOMMIT}" > $VERSION