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
    let rids = ["Q-4FFG", "Q-4CWP", "Q-61C8", "Q-4G4E", "Q-4G3G", "Q-5YW6", "Q-5KAP", "Q-4HBY", "Q-5Y4Y", "Q-53GY", "Q-5E32", "Q-5TJY", "Q-59QA", "Q-5JTA", "Q-5T2Y", "Q-5K0C", "Q-5PA6", "Q-5PAW", "Q-6RDM", "Q-6HAG", "Q-5MCW", "Q-6J9T", "Q-70NR", "Q-5KRJ", "Q-5JFY", "Q-463E", "Q-5HX4", "Q-3NBG", "Q-46FP", "Q-5G9W", "Q-3X14", "Q-471E", "Q-5FCA", "Q-5H7G", "Q-47AA", "Q-5EAW", "Q-5YGP", "Q-487T", "Q-5E18", "Q-48QJ", "Q-48NG", "Q-5CY8", "Q-5GZ2", "Q-48XY", "Q-5BW6", "Q-6QZG", "Q-496M", "Q-5B22", "Q-4A4M", "Q-497G", "Q-5AKM", "Q-5GGC", "Q-49CM", "Q-59XY", "Q-4858", "Q-49SM", "Q-59F0", "Q-4FMG", "Q-4AHG", "Q-594A", "Q-5G8M", "Q-4AK0", "Q-536P", "Q-3T8P", "Q-4B2G", "Q-534C", "Q-4G0R", "Q-4C46", "Q-52TW", "Q-5FSJ", "Q-4CBY", "Q-519W", "Q-6QDG", "Q-4CWC", "Q-511J", "Q-4MEY", "Q-4DDM", "Q-508W", "Q-5FC0", "Q-4DYR", "Q-4XTP", "Q-4H7P", "Q-4E38", "Q-4X46", "Q-4WYG", "Q-4FCC", "Q-4T6Y", "Q-5F6J", "Q-4FX6", "Q-4STE", "Q-48TR", "Q-4H7M", "Q-4SMW", "Q-5C20", "Q-4J4Y", "Q-4NAW", "Q-5EV4", "Q-4QHW", "Q-4M6A", "Q-6Q7J", "Q-4SY0", "Q-4JGC", "Q-5G2P", "Q-4WZ0", "Q-4JD0", "Q-5EF4", "Q-4XZM", "Q-4JC0"];
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
