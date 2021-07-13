const puppeteer = require('puppeteer');
const fs = require('fs').promises;

(async () => {
    const browser = await puppeteer.launch(["--start-maximized"]);
    const page = await browser.newPage();
    await page.setViewport({
        width: 1600,
        height: 850
    });
    /* ==== SPECIMEN TABLE ==== */
    // await page.goto('https://dev.rebuildingakidney.org/~jchudy/chaise/record/#2/Gene_Expression:Specimen/RID=N-GXA4');
    //
    // // wait 15 seconds for page to finish loading
    // await page.waitForTimeout(15000);
    // // show all related tables
    // await page.click("#show-all-related-tables");
    // await page.click("#share");
    // // wait 5 seconds for modal to show
    // await page.waitForTimeout(5000);
    // // move the cursor so tooltip doesn't always show
    // // await page.click(".side-panel-heading");
    //
    // await page.evaluate(() => {
    //     let headEle = document.querySelector('head');
    //     headEle.innerHTML += '<style type="text/css">.modal-error{display:none!important;}</style>';
    //     headEle.innerHTML += '<style type="text/css">.modal-backdrop{display:none!important;}</style>';
    //
    //     let bodyEle = document.querySelector('.chaise-body');
    //     bodyEle.innerHTML += '<script src="/~jchudy/chaise-ssr.js"></script>';
    //  });
    // // wait 5 seconds for body append
    // // await page.waitForTimeout(5000);
    //
    // var html = await page.content();
    // console.log("write specimen/N-GXA4.html");
    // await fs.writeFile("specimen/N-GXA4.html", html);


    /* ==== GENE TABLE ==== */
    // await page.goto('https://dev.rebuildingakidney.org/~jchudy/chaise/record/#2/Common:Gene/RID=Q-3KT8');
    //
    // // wait 30 seconds for page to finish loading
    // await page.waitForTimeout(30000);
    // // show all related tables
    // await page.click("#show-all-related-tables");
    // await page.click("#share");
    // // wait 10 seconds for modal to show
    // await page.waitForTimeout(10000);
    // // move the cursor so tooltip doesn't always show
    // // await page.click(".side-panel-heading");
    // html = await page.content();
    // await fs.writeFile("gene-test.html", html);
    //
    // /* ==== COLLECTION TABLE ==== */
    // await page.goto('https://dev.rebuildingakidney.org/~jchudy/chaise/record/#2/Common:Collection/RID=18-652Y');
    //
    // // wait 30 seconds for page to finish loading
    // await page.waitForTimeout(30000);
    // // show all related tables
    // await page.click("#show-all-related-tables");
    // await page.click("#share");
    // // wait 10 seconds for modal to show
    // await page.waitForTimeout(10000);
    // // move the cursor so tooltip doesn't always show
    // // await page.click(".side-panel-heading");
    // html = await page.content();
    // await fs.writeFile("collection-test.html", html);
    //
    // /* ==== PROTOCOL TABLE ==== */
    // await page.goto('https://dev.rebuildingakidney.org/~jchudy/chaise/record/#2/Protocol:Protocol/RID=N-H9AM');
    //
    // // wait 30 seconds for page to finish loading
    // await page.waitForTimeout(30000);
    // // show all related tables
    // await page.click("#show-all-related-tables");
    // await page.click("#share");
    // // wait 10 seconds for modal to show
    // await page.waitForTimeout(10000);
    // // move the cursor so tooltip doesn't always show
    // // await page.click(".side-panel-heading");
    // html = await page.content();
    // await fs.writeFile("protocol-test.html", html);

    let studyRids = ["16-DMQA", "16-DMQW", "W-RAHW", "16-DW7R", "16-WJNR", "16-WW2M"];
    /* ==== STUDY TABLE ==== */
    for (let i=0; i<studyRids.length; i++) {
        let rid = studyRids[i];
        await page.goto('https://dev.rebuildingakidney.org/~jchudy/chaise/record/#2/RNASeq:Study/RID=' + rid);

        // wait 15 seconds for page to finish loading
        await page.waitForTimeout(15000);
        // show all related tables
        await page.click("#show-all-related-tables");
        await page.click("#share");
        // wait 5 seconds for modal to show
        await page.waitForTimeout(5000);

        // append style and script tags
        await page.evaluate(() => {
            let headEle = document.querySelector('head');
            headEle.innerHTML += '<style type="text/css">.modal-error{display:none!important;}</style>';
            headEle.innerHTML += '<style type="text/css">.modal-backdrop{display:none!important;}</style>';

            let bodyEle = document.querySelector('.chaise-body');
            bodyEle.innerHTML += '<script src="/~jchudy/chaise-ssr.js"></script>';
         });

        var html = await page.content();
        console.log("write study/" + rid + ".html");
        await fs.writeFile("study/" + rid + ".html", html);
    }


    await browser.close();
})();
