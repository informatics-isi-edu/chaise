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
        // NOTE: files for study pages were generated using row 11 (RNASeq:Study Dataset) instead of row 12
        // row 12 is RNASeq:Study SSR
        let studySsrIdx = 11;
        // column 5 is the set of RIDs
        let ridIdx = 4;
        console.log(rows[studySsrIdx]);
        rids = rows[studySsrIdx][ridIdx].replace('["', '').replace('"]', '').split('", "');
    });
    const browser = await puppeteer.launch(["--start-maximized"]);
    const page = await browser.newPage();
    // page.on('console', consoleObj => console.log(consoleObj.text()));
    await page.setViewport({
        width: 1600,
        height: 850
    });

    /* ==== STUDY TABLE ==== */
    console.log("begin with " + rids.length + " study rids");
    console.log(rids);
    for (let i=0; i<rids.length; i++) {
        let rid = rids[i];
        let path = '/chaise/record/#2/RNASeq:Study/RID=' + rid
        await util.snapshot(page, 'https://staging.gudmap.org' + path, path, rid, "RNASeq:Study", i);
    }

    await browser.close();
})();
