#!/bin/bash

record_urls()
{
  # args: hostname application catalog_id schema table keycol
  curl -H "Accept: text/csv" "https://${1}/ermrest/catalog/${3}/attribute/${4}:${5}/${6}" \
    # There is a csv header line returned as the first row/entry so skip over that one
    | tail -n +2 \
    | while read key
  do
    # This does NOT take into account URL encoding
    # If {4} (schema) is something like "schema 1" the blankspace character will not be encoded properly as %20
    echo "https://${1}/${2}/record#${3}/${4}:${5}/${6}=${key}"
  done
}

# output file is in same directory as this sitemap script
# > overwrites file
record_urls www.facebase.org chaise 1 legacy dataset id > sitemap.txt
