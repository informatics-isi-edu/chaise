## Readme for generate-xml-sitemap.sh

1. To run the script open a terminal or command window with Bash available
2. Run `bash generate-xml-sitemap.sh {1} {2} {3} {4} {5} {6} > output.xml`

About the script:
- record_urls function takes in 6 arguments
  1. hostname
  2. application
  3. catalog_id
  4. schema
  5. table
  6. keycol
- An example of this script being used is for chaise application with the following values
  `bash generate-xml-sitemap.sh www.facebase.org chaise 1 isa dataset RID > sitemap.xml`
- The script currently outputs a XML sitemap file per the protocol https://www.sitemaps.org/protocol.html
- The output URLs for the sitemap currently do NOT take into account for values that need to be URL encoded.
- The sitemap needs to be defined in the robots.txt file to be read by Google's crawlers.
  - Format for robots.txt needs to include some instructions for web crawlers so they know how to interpret the file
  - User-agent: Signifies what types of bots can access/crawl the site. Defined with an asterisk/wildcard signifies that all bots must follow the below instruction.
  - Disallow: Allows the user to define what parts of the site should or should not be crawled. Leaving this blank tells the crawler to look at everything that it can.
  - Sitemap: The user can define a sitemap file that can point to URLs on the site that the crawler should visit. This is especially useful when there isn't links to all of the data and, in our case with chaise, the data is hidden behind pagination.
  - Robots.txt format:

    ```
    User-agent:*  
    Disallow:  
    Sitemap: http://www.example.com/sitemap.xml  
    ```

  - The sitemap definition in robots.txt needs to point to where the file is hosted by the application. The crawler CANNOT read into the file structure of the application on the server so it needs to be able to grab the sitemap from a page on the site.
  - Robots.txt allows multiple `Sitemap` lines. For example, you could generate one sitemap for all of your website content (e.g., like Jekyll generated sites) and one sitemap each for different categories of data that are accessible via Chaise.

