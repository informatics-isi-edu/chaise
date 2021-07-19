const puppeteer = require('puppeteer');
const util = require('./util.js');
const fs = require('fs').promises;

const parse = require('csv-parse');

(async () => {
    let rids = []
    let file = await fs.readFile("./RID-grouping.csv")
    await parse(file, {columns: false, trim: true}, (err, rows) => {
        // row 7 is Common:Collection SSR
        // column 5 is the set of RIDs
        console.log(rows[6]);
        rids = rows[6][4].replace('["', '').replace('"]', '').split('", "');
    });
    const browser = await puppeteer.launch(["--start-maximized"]);
    const page = await browser.newPage();
    // page.on('console', consoleObj => console.log(consoleObj.text()));
    await page.setViewport({
        width: 1600,
        height: 850
    });

    /* ==== COLLECTION TABLE ==== */
    console.log("begin with " + rids.length + " collection rids");
    console.log(rids);
    for (let i=0; i<rids.length; i++) {
        let rid = rids[i];
        let url = 'https://staging.gudmap.org/chaise/record/#2/Common:Collection/RID=' + rid
        await util.snapshot(page, url, rid, "collection", i);
    }

    await browser.close();
})();
