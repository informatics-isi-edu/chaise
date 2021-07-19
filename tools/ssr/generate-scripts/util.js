const fs = require('fs').promises;

module.exports.snapshot = async (page, url, rid, setName, counter) => {
    await page.goto(url);

    // wait 25 seconds for page to finish loading
    await page.waitForTimeout(25000);
    let error = await page.evaluate((rid, setName) => {
        let innerError = null;
        let errModal = document.querySelector('.modal-error');
        if (errModal && errModal.innerHTML != null ) {
            let date = new Date();
            let dateString = "" + date.toLocaleDateString() + "::" + date.toLocaleTimeString();
            innerError = {
                console: "Error modal shown. RID=" + rid + ". Logged in error-logs/" + setName + "-errors.txt",
                log: dateString + " Error modal shown. RID=" + rid + "\n"
            }
        }

        // TODO: loop through table contents

        return innerError;
    }, rid, setName);

    console.log("Error: ", error);
    if (error) {
        console.log(error.console);
        await fs.appendFile("error-logs/" + setName + "-errors.txt", error.log);
    } else {
        // show all related tables
        await page.click("#show-all-related-tables");
        await page.click("#share");
        // wait 15 seconds for modal to show
        await page.waitForTimeout(15000);

        // append style and script tags
        await page.evaluate(() => {
            let headEle = document.querySelector('head');
            headEle.innerHTML += '<style type="text/css">.modal-error{display:none!important;}</style>';
            headEle.innerHTML += '<style type="text/css">.modal-backdrop{display:none!important;}</style>';

            let bodyEle = document.querySelector('.chaise-body');
            bodyEle.innerHTML += '<script src="../../chaise-ssr.js"></script>';
        });
    }

    var html = await page.content();
    console.log(counter + " write " + setName + "/" + rid + ".html");
    await fs.writeFile(setName + "/" + rid + ".html", html);
}
