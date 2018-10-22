var chaisePage = require('../../../utils/chaise.page.js');
var EC = protractor.ExpectedConditions;
var testParams = {
    table_name: "links-table",
    key: {
        name: "id",
        value: "1",
        operator: "="
    }
};

describe('View existing record,', function() {

    describe("For table " + testParams.table_name + ",", function() {

        var table, record;

        beforeAll(function () {
            var keys = [];
            keys.push(testParams.key.name + testParams.key.operator + testParams.key.value);
            browser.ignoreSynchronization=true;
            var url = browser.params.url + "/record/#" + browser.params.catalogId + "/links:" + testParams.table_name + "/" + keys.join("&");
            browser.get(url);

            chaisePage.waitForElement(element(by.id('tblRecord')));
        });

        it ("The proper permalink (browser url) should appear in the share popup if resolverImplicitCatalog is undefined", function (done) {
            var shareButton = chaisePage.recordPage.getShareButton(),
                shareModal = chaisePage.recordPage.getShareModal();

            shareButton.click().then(function () {
                // wait for dialog to open
                chaisePage.waitForElement(shareModal);
                // disable animations in modal so that it doesn't "fade out" (instead it instantly disappears when closed) which we can't track with waitFor conditions
                shareModal.allowAnimations(false);

                return browser.getCurrentUrl();
            }).then(function (url) {
                expect(chaisePage.recordPage.getPermalinkText().getText()).toBe(url, "permalink url is incorrect");

                return chaisePage.recordEditPage.getModalTitle().element(by.tagName("button")).click();
            }).then(function () {
                done();
            }).catch(function(err){
                console.log(err);
                done.fail();
            });
        });

        it("Clicking the subtitle should redirect to recordset app", function() {
            var subtitleLink = chaisePage.recordPage.getEntitySubTitleLink();

            browser.wait(EC.elementToBeClickable(subtitleLink), browser.params.defaultTimeout);

            subtitleLink.click().then(function() {
                return browser.driver.getCurrentUrl();
            }).then(function(url) {
                expect(url.indexOf('recordset')).toBeGreaterThan(-1);
            });
        });
    });
});
