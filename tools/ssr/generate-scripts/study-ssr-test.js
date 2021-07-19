const puppeteer = require('puppeteer');
const util = require('./util.js');
const fs = require('fs').promises;

const parse = require('csv-parse');

(async () => {
    let rids = []
    let file = await fs.readFile("./RID-grouping.csv")
    await parse(file, {columns: false, trim: true}, (err, rows) => {
        // row 11 is RNASeq:Study SSR
        // column 5 is the set of RIDs
        console.log(rows[10]);
        rids = rows[10][4].replace('["', '').replace('"]', '').split('", "');
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
        let url = 'https://staging.gudmap.org/chaise/record/#2/RNASeq:Study/RID=' + rid
        await util.snapshot(page, url, rid, "study", i);
    }

    await browser.close();
})();
