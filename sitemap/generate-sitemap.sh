#!bin/bash

record_urls()
{
  curl -H "Accept: text/csv" "https://${1}/ermrest/catalog/${3}/attribute/${4}:${5}/${6}" \
  | tail -n +2 \
  | while read key
  do
    echo "https://${1}/${2}/record#${3}/${4}:${5}/${6}=${key}"
  done
}

record_urls ${1} ${2} ${3} ${4} ${5} ${6}
