#!/bin/bash

hostname="$1"
catalog_id="$2"
schema="$3"
table="$4"
changefreq=${5:-"weekly"}  # choices: always, hourly, daily, weekly, monthly, yearly, never
keycol="RID" # should not be changed without changing the output URL format too
app="chaise/record"

echo '<?xml version="1.0" encoding="UTF-8"?>'
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'

# There is a csv header line returned as the first row/entry so skip over that one
curl -H "Accept: text/csv" "https://${hostname}/ermrest/catalog/${catalog_id}/attribute/${schema}:${table}/${keycol}" \
| tail -n +2 \
| while read key
do
  # This does NOT take into account URL encoding. All arguments to this script
  # should have been encoded before passing to this script.
  echo "  <url>"
  echo "    <loc>https://${hostname}/${app}/?${catalog_id}/${schema}:${table}/${keycol}=${key}</loc>"
  echo "    <changefreq>${changefreq}</changefreq>"
  echo "  </url>"
done

echo '</urlset>'
