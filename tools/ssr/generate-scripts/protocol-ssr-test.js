const puppeteer = require('puppeteer');
const fs = require('fs').promises;

(async () => {
    const browser = await puppeteer.launch(["--start-maximized"]);
    const page = await browser.newPage();
    await page.setViewport({
        width: 1600,
        height: 850
    });

    /* ==== Protocol:Protocol TABLE ==== */
    let rids = ["N-H98E", "N-H98M", "N-H98T", "N-H992", "N-H99C", "N-H99A", "N-H99R", "N-H99Y", "N-H9AA", "N-H9AW", "N-H9B6", "N-H9D6", "N-H9BM", "N-H9C0", "N-H9C4", "N-H9CA", "N-H9CG", "N-H9CP", "N-H9D2", "N-H9CY", "N-H9DE", "N-H9DJ", "N-H9DR", "N-H9DY", "N-H9E4", "14-3R9C", "14-3RAG"];
    console.log("begin with " + rids.length + " protocol rids");
    for (let i=0; i<rids.length; i++) {
        let rid = rids[i];
        await page.goto('https://dev.rebuildingakidney.org/~jchudy/chaise/record/#2/Protocol:Protocol/RID=' + rid);

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
        console.log(i + " write protocol/" + rid + ".html");
        await fs.writeFile("protocol/" + rid + ".html", html);
    }

    await browser.close();
})();
