## Readme for generate-xml-sitemap.sh

The `generate-xml-sitemap.sh` will create a sitemap index for the publicly 
available (anonymously readable) entities in a given table. The url locations
will be to the "ermresolve" service. The script currently outputs contents of 
an [XML sitemap](https://www.sitemaps.org/protocol.html) file.

### Usage

To run the script open a terminal or command window with Bash available.

```
bash generate-xml-sitemap.sh {hostname} {catalog_id} {schema} {table} > sitemap.xml
```

For example, to generate a sitemap for the FaceBase Datasets:

```
bash generate-xml-sitemap.sh www.facebase.org 1 isa dataset > sitemap.xml
```

Arguments for the script:
1. `hostname`: hostname of the catalog service to be indexed
2. `catalog_id`= id of the catalog to be indexed
3. `schema`: name of the schema for the table to be indexed
4. `table`: name of the table to be indexed

Assumptions:
1. `table` has proper "system columns" including the `RID`
2. `hostname` has a properly configured `chaise/record` app

Limitations:
- The script does not URL encode arguments. You need to URL encode them before 
  passing them to the script.
- The script only produces sitemap url locations based on the Chaise Record app.

### Deployment

The sitemap needs to be defined in the `robots.txt` file to be read by 
crawlers. The `robots.txt` needs to include some instructions for web crawlers
so they know how to interpret the file.
  - `User-agent`: Signifies what types of bots can access/crawl the site. 
    Defined with an asterisk/wildcard signifies that all bots must follow the 
    below instruction.
  - `Disallow`: Allows the user to define what parts of the site should or 
    should not be crawled. Leaving this blank tells the crawler to look at 
    everything that it can.
  - `Sitemap`: The user can define a sitemap file that can point to URLs on the
    site that the crawler should visit. This is especially useful when there
    aren't crawlable links to all of the data, and in our case with chaise, the
    data is hidden behind pagination.
  - _Multiple sitemap entries are allowed_. In many deployments, it will be 
    useful to have one or more sitemaps for "static" generated content. Then,
    there can be one or more sitemaps for each table that is to be indexed. 
    Of course, these sitemaps could be aggregated, if desired.

This example `robots.txt` file shows one "sitemap.xml" for the static generated
content on this site and one for the "dataset" table.

```
User-agent:*  
Disallow:  
Sitemap: http://www.example.com/sitemap.xml 
Sitemap: http://www.example.com/dataset-sitemap.xml 
```
 
