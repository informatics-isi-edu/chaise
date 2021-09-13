const puppeteer = require('puppeteer');
const util = require('./util.js');
const fs = require('fs').promises;

const parse = require('csv-parse');

(async () => {
    let rids = []
    let file = await fs.readFile("./RID-grouping.csv")
    await parse(file, {columns: false, trim: true}, (err, rows) => {
        // row 3 is Protocol:Protocol SSR
        let protocolSsrIdx = 2;
        // column 5 is the set of RIDs
        let ridIdx = 4;
        console.log(rows[protocolSsrIdx]);
        rids = rows[protocolSsrIdx][ridIdx].replace('["', '').replace('"]', '').split('", "');
    });
    const browser = await puppeteer.launch(["--start-maximized"]);
    const page = await browser.newPage();
    // page.on('console', consoleObj => console.log(consoleObj.text()));
    await page.setViewport({
        width: 1600,
        height: 850
    });

    /* ==== PROTOCOL TABLE ==== */
    console.log("begin with " + rids.length + " protocol rids");
    console.log(rids);
    for (let i=0; i<rids.length; i++) {
        let rid = rids[i];
        let path = '/chaise/record/#2/Protocol:Protocol/RID=' + rid
        await util.snapshot(page, 'https://staging.gudmap.org' + path, path, rid, "Protocol:Protocol", i);
    }

    await browser.close();
})();
