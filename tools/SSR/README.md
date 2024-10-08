## About these scripts
The scripts in `chaise/tools/SSR` can be used to generate standalone pages of any of the chaise apps for any schema/table. All these scripts do are open a chrome instance using playwright, navigate to a `record` app page, and save the HTML content in a folder alongside the script.

These scripts were initially written using `puppeteer` to capture the state of `record` pages written in AngularJS for different resources hosted on "rbk/gudmap" which are now moved to "atlas-d2k".

### Installation and Running the scripts
To use these scripts, the following shouldbe done:
 1. run `npm install` to make sure the npm modules from the `package.json` alongside the scripts are downloaded and installed
   - this branch uses `csv-parse` which is not included in chaise
 2. Once installed, run `node protocol-ssr-test.js` (or any other script once updated)
   - the script won't create the `Protocol` folder that each html page is saved to, so that should be created before running this script
 3. This HTML page can be tested by uploading the HTML to a user directory on `dev.derivacloud.org` but some of the content might not look right because of versioned CSS not being included
   - The script generates a page from `www.atlas-d2k.org`, so the bundles and other assets that are mentioned in the `<head>` tag will be versioned from atlas-d2k.
   - If the HTML is uploaded to a user directory on `www.atlas-d2k.org`, the ReactJS bundles will be laoded and start to run, causing some unintended consequences

## Playwright and ReactJS version
The current changes in `protocol-ssr-test.js` in this branch use `playwright` instead of `puppeteer` to open the designated chaise pages. The script opens a `record` page on www.atlas-d2k.org, click the "Show empty sections" button, and downlaods the HTML content.

## Puppeteer and AngularJS version
When this was done before for `AngularJS` with `puppeteer`, the pages were hosted on a server with the `chaise-ssr.js` script alongside it to "rehydrate" the functionality of the standalone document with `jquery` functions. Other changes were made to the "deployed" version of Chaise to add more ids and classes to elements on the page for the jquery.

Some direct javascript changes were made to the AngularJS application so that certain functionality wouldn't trigger when the page loaded. Since the standalone page was hosted alongside the working version of chaise so the assets could be reused, the `AngularJS` javascript was running again to "set up the page", but the page was already set up when then html content was downloaded. For instance, the `reference.read` request was bipassed to ignore fetching the data again since it was already present.

## Files and Data
### Scripts
There are a few scripts included in this folder. The `*-SSR-test.js` scripts are the entry points for generating each different page with the first part of the filename being the table name we are downloading HTML content for.

`util.js` is used by each of the `*-SSR-test.js` scripts to have the `snapshot` function resued by each one. This function handles going to the mentioned page, verifying there was no error modal present, showing all "empty related sections", and downloading the HTML content to the specified folder.

`chaise-ssr.js` is the js document that was hosted alongside each of these SSR pages to "rehydrate" the functionality of the page using jquery.

### CSV data
Included with the scripts are 2 CSV files. `RID-grouping.csv` details what RIDs to use for each resource mentioned in that document (coincides with each `*-ssr-test.js` script). For each schema:table combination, there are 3 groups, `Dataset`, `SSR`, and `Chaise`. These are from when we were trying to figure out how to best host data for google indexing (between chaise pages mentioned in the sitemap, google dataset, or as standalone SSR pages). `gene-grouping.csv` details the number of subresources that are available for each Gene record page.
