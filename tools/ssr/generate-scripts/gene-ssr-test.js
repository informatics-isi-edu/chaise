const puppeteer = require('puppeteer');
const util = require('./util.js');
const fs = require('fs').promises;

const parse = require('csv-parse');

(async () => {
    let rids = []
    let file = await fs.readFile("./RID-grouping.csv")
    await parse(file, {columns: false, trim: true}, (err, rows) => {
        // row 14 is Common:Gene SSR
        let geneSsrIdx = 13; // -1 for 0 index
        // column 5 is the set of RIDs
        let ridIdx = 4; // -1 for 0 index
        console.log(rows[geneSsrIdx][0] + " " + rows[geneSsrIdx][1]);
        rids = rows[geneSsrIdx][ridIdx].replace('["', '').replace('"]', '').split('", "');
    });
    const browser = await puppeteer.launch(["--start-maximized"]);
    const page = await browser.newPage();
    // page.on('console', consoleObj => console.log(consoleObj.text()));
    await page.setViewport({
        width: 1600,
        height: 850
    });

    /* ==== GENE TABLE ==== */
    console.log("begin with " + rids.length + " gene rids");
    console.log(rids);
    for (let i=0; i<rids.length; i++) {
        let rid = rids[i];
        let path = '/chaise/record/#2/Common:Gene/RID=' + rid
        await util.snapshot(page, 'https://staging.gudmap.org' + path, path, rid, "Common:Gene", i);
    }

    await browser.close();
})();
