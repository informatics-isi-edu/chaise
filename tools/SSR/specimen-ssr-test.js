/**
 * NOTE: This is the old script that uses puppeteer and the AngularJS version of Chaise
 *
 * For this to work with the ReactJS version of Chaise, this script should be updated to
 * be similar to `protocol-ssr-test.js` which uses the already included version of
 * playwright from the end to end tests.
 */

const puppeteer = require('puppeteer');
const util = require('./util.js');
const fs = require('fs').promises;

const parse = require('csv-parse');

(async () => {
    let rids = []
    let file = await fs.readFile("./RID-grouping.csv")
    await parse(file, {columns: false, trim: true}, (err, rows) => {
        // row 18 is Gene_Expression:Specimen SSR
        let specimenSsrIdx = 17;
        // column 5 is the set of RIDs
        let ridIdx = 4;
        console.log(rows[specimenSsrIdx]);
        rids = rows[specimenSsrIdx][ridIdx].replace('["', '').replace('"]', '').split('", "');
    });
    const browser = await puppeteer.launch(["--start-maximized"]);
    const page = await browser.newPage();
    // page.on('console', consoleObj => console.log(consoleObj.text()));
    await page.setViewport({
        width: 1600,
        height: 850
    });

    /* ==== SPECIMEN TABLE ==== */
    console.log("begin with " + rids.length + " specimen rids");
    console.log(rids);
    for (let i=0; i<rids.length; i++) {
        let rid = rids[i];
        let path = '/chaise/record/#2/Gene_Expression:Specimen/RID=' + rid
        await util.snapshot(page, 'https://staging.gudmap.org' + path, path, rid, "Gene_Expression:Specimen", i);
    }

    await browser.close();
})();
