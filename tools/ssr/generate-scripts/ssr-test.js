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
    await page.goto('https://dev.rebuildingakidney.org/~jchudy/chaise/record/#2/Gene_Expression:Specimen/RID=N-GXA4');

    // wait 30 seconds for page to finish loading
    await page.waitForTimeout(30000);
    // show all related tables
    await page.click("#show-all-related-tables");
    await page.click("#share");
    // wait 10 seconds for modal to show
    await page.waitForTimeout(10000);
    // move the cursor so tooltip doesn't always show
    // await page.click(".side-panel-heading");
    var html = await page.content();
    await fs.writeFile("specimen-test.html", html);

    /* ==== GENE TABLE ==== */
    await page.goto('https://dev.rebuildingakidney.org/~jchudy/chaise/record/#2/Common:Gene/RID=Q-3KT8');

    // wait 30 seconds for page to finish loading
    await page.waitForTimeout(30000);
    // show all related tables
    await page.click("#show-all-related-tables");
    await page.click("#share");
    // wait 10 seconds for modal to show
    await page.waitForTimeout(10000);
    // move the cursor so tooltip doesn't always show
    // await page.click(".side-panel-heading");
    html = await page.content();
    await fs.writeFile("gene-test.html", html);

    /* ==== COLLECTION TABLE ==== */
    await page.goto('https://dev.rebuildingakidney.org/~jchudy/chaise/record/#2/Common:Collection/RID=18-652Y');

    // wait 30 seconds for page to finish loading
    await page.waitForTimeout(30000);
    // show all related tables
    await page.click("#show-all-related-tables");
    await page.click("#share");
    // wait 10 seconds for modal to show
    await page.waitForTimeout(10000);
    // move the cursor so tooltip doesn't always show
    // await page.click(".side-panel-heading");
    html = await page.content();
    await fs.writeFile("collection-test.html", html);

    /* ==== PROTOCOL TABLE ==== */
    await page.goto('https://dev.rebuildingakidney.org/~jchudy/chaise/record/#2/Protocol:Protocol/RID=N-H9AM');

    // wait 30 seconds for page to finish loading
    await page.waitForTimeout(30000);
    // show all related tables
    await page.click("#show-all-related-tables");
    await page.click("#share");
    // wait 10 seconds for modal to show
    await page.waitForTimeout(10000);
    // move the cursor so tooltip doesn't always show
    // await page.click(".side-panel-heading");
    html = await page.content();
    await fs.writeFile("protocol-test.html", html);

    /* ==== STUDY TABLE ==== */
    await page.goto('https://dev.rebuildingakidney.org/~jchudy/chaise/record/#2/RNASeq:Study/RID=Q-Y4GY');

    // wait 30 seconds for page to finish loading
    await page.waitForTimeout(30000);
    // show all related tables
    await page.click("#show-all-related-tables");
    await page.click("#share");
    // wait 10 seconds for modal to show
    await page.waitForTimeout(10000);
    // move the cursor so tooltip doesn't always show
    // await page.click(".side-panel-heading");
    html = await page.content();
    await fs.writeFile("study-test.html", html);


    await browser.close();
})();
