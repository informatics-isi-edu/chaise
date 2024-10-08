// NOTE: This script is very similar to the previous version from AngularJS with some minor modifications
//   to ensure it works with the ReactJS version of the app. Some old functionality is commented out in case
//   similar functionality wants to be added later when using this function

const fs = require('fs').promises;

module.exports.snapshot = async (page, url, path, rid, setName, counter, loadingPause, modalPause) => {
    await page.goto(url);

    // wait 25 seconds for page to finish loading
    loadingPause = loadingPause || 25000
    await page.waitForTimeout(loadingPause);
    let error = await page.evaluate(async (params) => {
        let innerError = null;
        let errModal = document.querySelector('.modal-error');
        if (errModal && errModal.innerHTML != null ) {
            let date = new Date();
            let dateString = "" + date.toLocaleDateString() + "::" + date.toLocaleTimeString();
            innerError = {
                console: "Error modal shown. RID=" + params.rid + ". Logged in error-logs/" + params.setName + "-errors.txt",
                log: dateString + " Error modal shown. RID=" + params.rid + "\n"
            }
        }

        return innerError;
    }, { rid, setName } );

    console.log("Error: ", error);
    if (error) {
        console.log(error.console);
        await fs.appendFile("error-logs/" + setName + "-errors.txt", error.log);
    } else {
        // show all related tables
        await page.locator('.toggle-empty-sections').click();
        await page.locator('.entity-title').hover();

        // open share/cite popup
        // await page.locator('.share-cite-btn').click();
        // wait 15 seconds for modal to show
        // modalPause = modalPause || 15000
        // await page.waitForTimeout(modalPause);

        // append style and script tags
        // await page.evaluate((hrefPath) => {
        //     let headEle = document.querySelector('head');
        //     headEle.innerHTML += '<style type="text/css">.modal-error{display:none!important;}</style>';
        //     headEle.innerHTML += '<style type="text/css">.modal-backdrop{display:none!important;}</style>';

        //     let bodyEle = document.querySelector('.chaise-body');
        //     bodyEle.innerHTML += '<script src="../chaise-ssr.js"></script>';
        //     bodyEle.innerHTML += '<div style="display:none;" data-page-href="' + hrefPath + '"></div>'
        // }, path);
    }

    var html = await page.content();
    console.log(`${counter} write ${setName}/RID=${rid}`);

    // NOTE: this won't create the folder if it's not there and errors instead
    await fs.writeFile(`${setName}/RID=${rid}.html`, html);
}
