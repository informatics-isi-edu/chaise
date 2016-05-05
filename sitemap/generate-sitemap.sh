#!/bin/bash

record_urls()
{
  # args: hostname application catalog_id schema table keycol
  # There is a csv header line returned as the first row/entry so skip over that one
  curl -H "Accept: text/csv" "https://${1}/ermrest/catalog/${3}/attribute/${4}:${5}/${6}" \
  | tail -n +2 \
  | while read key
  do
    # This does NOT take into account URL encoding
    # if ${4} (schema) is something like "schema 1", the blankspace character will not be encoded properly as %20
    echo "https://${1}/${2}/record/#${3}/${4}:${5}/${6}=${key}"
  done
}

record_urls ${1} ${2} ${3} ${4} ${5} ${6}
