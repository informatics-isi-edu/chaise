const puppeteer = require('puppeteer');
const fs = require('fs').promises;

(async () => {
    const browser = await puppeteer.launch(["--start-maximized"]);
    const page = await browser.newPage();
    await page.setViewport({
        width: 1600,
        height: 850
    });

    // all rid:
    // let rids = ["Q-3MDM", "Q-515R", "Q-4HRC", "Q-4764", "Q-51ZT", "Q-4H6W", "Q-5E5W", "Q-539W", "Q-4G9Y", "Q-4CBC", "Q-5ASY", "Q-4G5Y", "Q-47T6", "Q-5H2M", "Q-4G2T", "Q-5DVW", "Q-5JYC", "Q-4FZ0", "Q-6Q1R", "Q-5VT4", "Q-4FEW", "Q-490E", "Q-5YGR", "Q-4F7P", "Q-5D3A", "Q-639W", "Q-4EG2", "Q-3QG0", "Q-6DRR", "Q-4E8G", "Q-4ARM", "Q-6KCR", "Q-4DY2", "Q-5BTP", "Q-6NA2", "Q-4DS6", "Q-4G0J", "Q-6Q3J", "Q-4CZ4", "Q-4C4A", "Q-706C", "Q-4CVE", "Q-5BB4", "Q-7GMG", "Q-4CMY", "Q-6PPE", "Q-3QG6", "Q-4CBW", "Q-4CYT", "Q-3TCJ", "Q-4C5T", "Q-5B08", "Q-47SW", "Q-4BVG", "Q-4Y0T", "Q-4G5E", "Q-4BHC", "Q-4FKW", "Q-4TDP", "Q-4AJW", "Q-5AVR", "Q-5RJJ", "Q-4AHA", "Q-4MCA", "Q-62KM", "Q-4ADM", "Q-4M9G", "Q-7N5T", "Q-4A1J", "Q-5AM8", "Q-3NQ2", "Q-49HP", "Q-6NXT", "Q-3QP2", "Q-49AA", "Q-5AE4", "Q-3W7W", "Q-4966", "Q-5AFW", "Q-46B6", "Q-48SW", "Q-87XA", "Q-46NG", "Q-48AG", "Q-5F0G", "Q-46T6", "Q-4898", "Q-5A16", "Q-4728", "Q-4846", "Q-6J8E", "Q-47NE", "Q-47R0", "Q-5G9M", "Q-47TY", "Q-47GE", "Q-591J", "Q-4828", "Q-478W", "Q-6NQJ", "Q-48MA", "Q-475P", "Q-5ZW6", "Q-48TT", "Q-46Z2", "Q-5344", "Q-4910", "Q-46NJ", "Q-3QNP", "Q-496C", "Q-468E", "Q-67B4", "Q-49R8", "Q-405R", "Q-52NJ", "Q-4A2G", "Q-3Z3M", "Q-3YGA", "Q-4ACY", "Q-3WMJ", "Q-75V2", "Q-4AKE", "Q-3VGY", "Q-51E4", "Q-4BA4", "Q-3S86", "Q-6N6P", "Q-4BVP", "Q-3PNA", "Q-3S6Y", "Q-4BZC", "Q-3NE2", "Q-50RM", "Q-4C9A", "Q-871E", "Q-5Z04", "Q-4CYG", "Q-71HG", "Q-46KM", "Q-4D0T", "Q-6SDY", "Q-4YDA", "Q-4D4E", "Q-6J08", "Q-4724", "Q-4D68", "Q-66VC", "Q-4720", "Q-4DEJ", "Q-64Q4", "Q-4XJE", "Q-4DN6", "Q-605T", "Q-6MWP", "Q-4E0C", "Q-5NY2", "Q-4844", "Q-4ECM", "Q-5GA2", "Q-4T7C", "Q-4F2R", "Q-5CVA", "Q-7WT8", "Q-4FET", "Q-5BSE", "Q-48N4", "Q-4G2E", "Q-5BNY", "Q-4SMT", "Q-4G8G", "Q-5ANA", "Q-489J", "Q-4H4M", "Q-5A9A", "Q-49J6", "Q-4J58", "Q-59EG", "Q-4SAG", "Q-4JER", "Q-52X0", "Q-6M1J", "Q-4P76", "Q-50XP", "Q-4ADC", "Q-4PKC", "Q-4XRC", "Q-4N9A", "Q-4T2T", "Q-4W48", "Q-496G", "Q-50VE", "Q-4QJ8", "Q-4BEP", "Q-518T", "Q-4MBW", "Q-4MBC", "Q-52YW", "Q-4HPA", "Q-494M", "Q-59MC", "Q-4HC0", "Q-4C2Y", "Q-5AGE", "Q-4FXG", "Q-4JG8", "Q-5BMC", "Q-4F2J", "Q-6K3J", "Q-5D04", "Q-4EB0", "Q-4CT4", "Q-5GPP", "Q-4E4W", "Q-4JG2", "Q-5K00", "Q-4CQJ", "Q-6KZC", "Q-5MR2", "Q-4BY0", "Q-4D0E", "Q-5S1A", "Q-4BDM", "Q-4JE8", "Q-5VDG", "Q-4AK2", "Q-4AJT", "Q-5YW4", "Q-48M8", "Q-4DN2", "Q-60NY", "Q-487P", "Q-4JCT", "Q-64R8", "Q-47K0", "Q-6JD8", "Q-6AFW", "Q-46XY", "Q-4F1R", "Q-6KV4", "Q-44YR", "Q-4J8W", "Q-6NMR", "Q-3Y6A", "Q-763R", "Q-6PF2", "Q-79Z8", "Q-4FVG", "Q-6S8E", "Q-74JP", "Q-4HZM", "Q-712R", "Q-4C9E", "Q-4GB0", "Q-4HHA", "Q-6H5Y", "Q-4HEY", "Q-4HC4", "Q-3P7A", "Q-4HJP", "Q-4H7T", "Q-4DSC", "Q-4HX8", "Q-4H64", "Q-6H1R", "Q-4JEJ", "Q-4GAP", "Q-3ZZP", "Q-4SMR", "Q-4G7A", "Q-4FVM", "Q-4YDW", "Q-4FTP", "Q-6BD8", "Q-51BJ", "Q-4F5J", "Q-712C", "Q-59KT", "Q-4E8J", "Q-4H62", "Q-5KK8", "Q-4DN0", "Q-65V2", "Q-5S3T", "Q-4D22", "Q-3TAR", "Q-5THW", "Q-4CV4", "Q-4J8M", "Q-634M", "Q-4CBA", "Q-62D8", "Q-6AM8", "Q-4BM6", "Q-5BQA", "Q-6J9J", "Q-4B6M", "Q-4SSW", "Q-6KA6", "Q-4AHP", "Q-6160", "Q-6P4Y", "Q-4AE8", "Q-6WX0", "Q-718W", "Q-49QG", "Q-50VJ", "Q-5K8A", "Q-48ZA", "Q-5YWE", "Q-46CC", "Q-48RC", "Q-4ASW", "Q-488T", "Q-48MY", "Q-5EC8", "Q-48WT", "Q-47XY", "Q-5VKM", "Q-49GR", "Q-47GG", "Q-494G", "Q-4AHM", "Q-46PW", "Q-5K9A", "Q-4C62", "Q-41Y4", "Q-5V38", "Q-4CBP", "Q-3Z7T", "Q-6S0E", "Q-4DD6", "Q-3Y2M", "Q-6BX0", "Q-4DGJ", "Q-3TY0", "Q-5TBT", "Q-4FRC", "Q-3QQA", "Q-3NR6", "Q-4GAR", "Q-A21E", "Q-3M46", "Q-4HQY", "Q-7B50", "Q-5QXT", "Q-4J92", "Q-7148", "Q-4BGR", "Q-4NWJ", "Q-6XPE", "Q-465E", "Q-5C2P", "Q-6SMC", "Q-5PF2", "Q-5DGE", "Q-6RWJ", "Q-6RTG", "Q-5KEE", "Q-6RBW", "Q-48KR", "Q-62DP", "Q-6PZG", "Q-5PA4", "Q-6AH4", "Q-6PN0", "Q-46K4", "Q-6KG2", "Q-6NH4", "Q-4BX8", "Q-6MYR", "Q-6KQT", "Q-5P0P", "Q-6NZC", "Q-6JPR", "Q-4CJ4", "Q-6RV0", "Q-6GYE", "Q-4D3A", "Q-6XCC", "Q-6GCT", "Q-5NG0", "Q-40KA", "Q-6B34", "Q-6RHJ", "Q-4854", "Q-64TW", "Q-4FK2", "Q-49V4", "Q-63QC", "Q-5MEG", "Q-4AKY", "Q-623R", "Q-4FFG", "Q-4CWP", "Q-61C8", "Q-4G4E", "Q-4G3G", "Q-5YW6", "Q-5KAP", "Q-4HBY", "Q-5Y4Y", "Q-53GY", "Q-5E32", "Q-5TJY", "Q-59QA", "Q-5JTA", "Q-5T2Y", "Q-5K0C", "Q-5PA6", "Q-5PAW", "Q-6RDM", "Q-6HAG", "Q-5MCW", "Q-6J9T", "Q-70NR", "Q-5KRJ", "Q-5JFY", "Q-463E", "Q-5HX4", "Q-3NBG", "Q-46FP", "Q-5G9W", "Q-3X14", "Q-471E", "Q-5FCA", "Q-5H7G", "Q-47AA", "Q-5EAW", "Q-5YGP", "Q-487T", "Q-5E18", "Q-48QJ", "Q-48NG", "Q-5CY8", "Q-5GZ2", "Q-48XY", "Q-5BW6", "Q-6QZG", "Q-496M", "Q-5B22", "Q-4A4M", "Q-497G", "Q-5AKM", "Q-5GGC", "Q-49CM", "Q-59XY", "Q-4858", "Q-49SM", "Q-59F0", "Q-4FMG", "Q-4AHG", "Q-594A", "Q-5G8M", "Q-4AK0", "Q-536P", "Q-3T8P", "Q-4B2G", "Q-534C", "Q-4G0R", "Q-4C46", "Q-52TW", "Q-5FSJ", "Q-4CBY", "Q-519W", "Q-6QDG", "Q-4CWC", "Q-511J", "Q-4MEY", "Q-4DDM", "Q-508W", "Q-5FC0", "Q-4DYR", "Q-4XTP", "Q-4H7P", "Q-4E38", "Q-4X46", "Q-4WYG", "Q-4FCC", "Q-4T6Y", "Q-5F6J", "Q-4FX6", "Q-4STE", "Q-48TR", "Q-4H7M", "Q-4SMW", "Q-5C20", "Q-4J4Y", "Q-4NAW", "Q-5EV4", "Q-4QHW", "Q-4M6A", "Q-6Q7J", "Q-4SY0", "Q-4JGC", "Q-5G2P", "Q-4WZ0", "Q-4JD0", "Q-5EF4", "Q-4XZM", "Q-4JC0"];

    /* ==== Common:Gene TABLE ==== */
    let rids = ["Q-3MDM", "Q-515R", "Q-4HRC", "Q-4764", "Q-51ZT", "Q-4H6W", "Q-5E5W", "Q-539W", "Q-4G9Y", "Q-4CBC", "Q-5ASY", "Q-4G5Y", "Q-47T6", "Q-5H2M", "Q-4G2T", "Q-5DVW", "Q-5JYC", "Q-4FZ0", "Q-6Q1R", "Q-5VT4", "Q-4FEW", "Q-490E", "Q-5YGR", "Q-4F7P", "Q-5D3A", "Q-639W", "Q-4EG2", "Q-3QG0", "Q-6DRR", "Q-4E8G", "Q-4ARM", "Q-6KCR", "Q-4DY2", "Q-5BTP", "Q-6NA2", "Q-4DS6", "Q-4G0J", "Q-6Q3J", "Q-4CZ4", "Q-4C4A", "Q-706C", "Q-4CVE", "Q-5BB4", "Q-7GMG", "Q-4CMY", "Q-6PPE", "Q-3QG6", "Q-4CBW", "Q-4CYT", "Q-3TCJ", "Q-4C5T", "Q-5B08", "Q-47SW", "Q-4BVG", "Q-4Y0T", "Q-4G5E", "Q-4BHC", "Q-4FKW", "Q-4TDP", "Q-4AJW", "Q-5AVR", "Q-5RJJ", "Q-4AHA", "Q-4MCA", "Q-62KM", "Q-4ADM", "Q-4M9G", "Q-7N5T", "Q-4A1J", "Q-5AM8", "Q-3NQ2", "Q-49HP", "Q-6NXT", "Q-3QP2", "Q-49AA", "Q-5AE4", "Q-3W7W", "Q-4966", "Q-5AFW", "Q-46B6", "Q-48SW", "Q-87XA", "Q-46NG", "Q-48AG", "Q-5F0G", "Q-46T6", "Q-4898", "Q-5A16", "Q-4728", "Q-4846", "Q-6J8E", "Q-47NE", "Q-47R0", "Q-5G9M", "Q-47TY", "Q-47GE", "Q-591J", "Q-4828", "Q-478W", "Q-6NQJ", "Q-48MA", "Q-475P", "Q-5ZW6", "Q-48TT", "Q-46Z2", "Q-5344", "Q-4910", "Q-46NJ", "Q-3QNP", "Q-496C", "Q-468E", "Q-67B4", "Q-49R8", "Q-405R", "Q-52NJ", "Q-4A2G", "Q-3Z3M", "Q-3YGA", "Q-4ACY", "Q-3WMJ", "Q-75V2", "Q-4AKE", "Q-3VGY", "Q-51E4", "Q-4BA4", "Q-3S86", "Q-6N6P", "Q-4BVP", "Q-3PNA", "Q-3S6Y", "Q-4BZC", "Q-3NE2", "Q-50RM", "Q-4C9A", "Q-871E", "Q-5Z04", "Q-4CYG", "Q-71HG", "Q-46KM", "Q-4D0T", "Q-6SDY", "Q-4YDA", "Q-4D4E", "Q-6J08", "Q-4724", "Q-4D68", "Q-66VC"];
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
