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
    let rids = ["Q-4720", "Q-4DEJ", "Q-64Q4", "Q-4XJE", "Q-4DN6", "Q-605T", "Q-6MWP", "Q-4E0C", "Q-5NY2", "Q-4844", "Q-4ECM", "Q-5GA2", "Q-4T7C", "Q-4F2R", "Q-5CVA", "Q-7WT8", "Q-4FET", "Q-5BSE", "Q-48N4", "Q-4G2E", "Q-5BNY", "Q-4SMT", "Q-4G8G", "Q-5ANA", "Q-489J", "Q-4H4M", "Q-5A9A", "Q-49J6", "Q-4J58", "Q-59EG", "Q-4SAG", "Q-4JER", "Q-52X0", "Q-6M1J", "Q-4P76", "Q-50XP", "Q-4ADC", "Q-4PKC", "Q-4XRC", "Q-4N9A", "Q-4T2T", "Q-4W48", "Q-496G", "Q-50VE", "Q-4QJ8", "Q-4BEP", "Q-518T", "Q-4MBW", "Q-4MBC", "Q-52YW", "Q-4HPA", "Q-494M", "Q-59MC", "Q-4HC0", "Q-4C2Y", "Q-5AGE", "Q-4FXG", "Q-4JG8", "Q-5BMC", "Q-4F2J", "Q-6K3J", "Q-5D04", "Q-4EB0", "Q-4CT4", "Q-5GPP", "Q-4E4W", "Q-4JG2", "Q-5K00", "Q-4CQJ", "Q-6KZC", "Q-5MR2", "Q-4BY0", "Q-4D0E", "Q-5S1A", "Q-4BDM", "Q-4JE8", "Q-5VDG", "Q-4AK2", "Q-4AJT", "Q-5YW4", "Q-48M8", "Q-4DN2", "Q-60NY", "Q-487P", "Q-4JCT", "Q-64R8", "Q-47K0", "Q-6JD8", "Q-6AFW", "Q-46XY", "Q-4F1R", "Q-6KV4", "Q-44YR", "Q-4J8W", "Q-6NMR", "Q-3Y6A", "Q-763R", "Q-6PF2", "Q-79Z8", "Q-4FVG", "Q-6S8E", "Q-74JP", "Q-4HZM", "Q-712R", "Q-4C9E", "Q-4GB0", "Q-4HHA", "Q-6H5Y", "Q-4HEY", "Q-4HC4", "Q-3P7A", "Q-4HJP", "Q-4H7T", "Q-4DSC", "Q-4HX8", "Q-4H64", "Q-6H1R", "Q-4JEJ", "Q-4GAP", "Q-3ZZP", "Q-4SMR", "Q-4G7A", "Q-4FVM", "Q-4YDW", "Q-4FTP", "Q-6BD8", "Q-51BJ", "Q-4F5J", "Q-712C", "Q-59KT", "Q-4E8J", "Q-4H62", "Q-5KK8", "Q-4DN0", "Q-65V2", "Q-5S3T", "Q-4D22", "Q-3TAR", "Q-5THW", "Q-4CV4", "Q-4J8M", "Q-634M", "Q-4CBA", "Q-62D8", "Q-6AM8", "Q-4BM6", "Q-5BQA"];
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
