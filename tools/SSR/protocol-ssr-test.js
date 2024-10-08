/**
 * NOTE: This script works with the current version of playwright from the test suite
 *   and the added library in this branch, "csv-parse"
 *
 * An example of what this script generates can be found in the "Protocol" folder
 */

const playwright = require('playwright');
const util = require('./util.js');
const fs = require('fs').promises;

const csvParse = require('csv-parse');

(async () => {
    let rids = []
    let file = await fs.readFile("./CSVs/RID-grouping.csv")
    await csvParse.parse(file, {columns: false, trim: true}, (err, rows) => {
        // row 3 is Protocol:Protocol SSR
        let protocolSsrIdx = 2;
        // column 5 is the set of RIDs
        let ridIdx = 4;
        console.log(rows[protocolSsrIdx]);
        rids = rows[protocolSsrIdx][ridIdx].replace('["', '').replace('"]', '').split('", "');
    });

    const browser = await playwright.chromium.launch({
        headless: false
      });
    const page = await browser.newPage();

    /* ==== PROTOCOL TABLE ==== */
    console.log("begin with " + rids.length + " protocol rids");
    console.log(rids);
    for (let i=0; i<rids.length; i++) {
        let rid = rids[i];
        let path = '/chaise/record/#2/Protocol:Protocol/RID=' + rid

        // NOTE: for this to work, the "Protocol" folder needs to be created manually
        //   or modify the script to create the folder if it doesn't exist yet
        await util.snapshot(page, 'https://www.atlas-d2k.org' + path, path, rid, 'Protocol', i, 5000, 1000);
    }

    await browser.close();
})();
