const puppeteer = require('puppeteer');
const fs = require('fs').promises;

(async () => {
    const browser = await puppeteer.launch(["--start-maximized"]);
    const page = await browser.newPage();
    await page.setViewport({
        width: 1600,
        height: 850
    });

    /* ==== Common:Gene TABLE ==== */
    let rids = ["Q-6J9J", "Q-4B6M", "Q-4SSW", "Q-6KA6", "Q-4AHP", "Q-6160", "Q-6P4Y", "Q-4AE8", "Q-6WX0", "Q-718W", "Q-49QG", "Q-50VJ", "Q-5K8A", "Q-48ZA", "Q-5YWE", "Q-46CC", "Q-48RC", "Q-4ASW", "Q-488T", "Q-48MY", "Q-5EC8", "Q-48WT", "Q-47XY", "Q-5VKM", "Q-49GR", "Q-47GG", "Q-494G", "Q-4AHM", "Q-46PW", "Q-5K9A", "Q-4C62", "Q-41Y4", "Q-5V38", "Q-4CBP", "Q-3Z7T", "Q-6S0E", "Q-4DD6", "Q-3Y2M", "Q-6BX0", "Q-4DGJ", "Q-3TY0", "Q-5TBT", "Q-4FRC", "Q-3QQA", "Q-3NR6", "Q-4GAR", "Q-A21E", "Q-3M46", "Q-4HQY", "Q-7B50", "Q-5QXT", "Q-4J92", "Q-7148", "Q-4BGR", "Q-4NWJ", "Q-6XPE", "Q-465E", "Q-5C2P", "Q-6SMC", "Q-5PF2", "Q-5DGE", "Q-6RWJ", "Q-6RTG", "Q-5KEE", "Q-6RBW", "Q-48KR", "Q-62DP", "Q-6PZG", "Q-5PA4", "Q-6AH4", "Q-6PN0", "Q-46K4", "Q-6KG2", "Q-6NH4", "Q-4BX8", "Q-6MYR", "Q-6KQT", "Q-5P0P", "Q-6NZC", "Q-6JPR", "Q-4CJ4", "Q-6RV0", "Q-6GYE", "Q-4D3A", "Q-6XCC", "Q-6GCT", "Q-5NG0", "Q-40KA", "Q-6B34", "Q-6RHJ", "Q-4854", "Q-64TW", "Q-4FK2", "Q-49V4", "Q-63QC", "Q-5MEG", "Q-4AKY", "Q-623R"];
    console.log("begin with " + rids.length + " gene rids");
    for (let i=0; i<rids.length; i++) {
        let rid = rids[i];
        await page.goto('https://dev.rebuildingakidney.org/~jchudy/chaise/record/#2/Common:Gene/RID=' + rid);

        // wait 15 seconds for page to finish loading
        await page.waitForTimeout(25000);
        // show all related tables
        await page.click("#show-all-related-tables");
        await page.click("#share");
        // wait 5 seconds for modal to show
        await page.waitForTimeout(10000);

        // append style and script tags
        await page.evaluate(() => {
            let headEle = document.querySelector('head');
            headEle.innerHTML += '<style type="text/css">.modal-error{display:none!important;}</style>';
            headEle.innerHTML += '<style type="text/css">.modal-backdrop{display:none!important;}</style>';

            let bodyEle = document.querySelector('.chaise-body');
            bodyEle.innerHTML += '<script src="/~jchudy/chaise-ssr.js"></script>';
         });

        var html = await page.content();
        console.log(i + " write gene/" + rid + ".html");
        await fs.writeFile("gene/" + rid + ".html", html);
    }


    await browser.close();
})();
