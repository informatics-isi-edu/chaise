var chaisePage = require('../../../utils/chaise.page.js');
var EC = protractor.ExpectedConditions;
var testParams = {
    table_name: "accommodation",
    key: {
        name: "id",
        value: "4004",
        operator: "="
    }
}

describe('View existing record,', function() {

    describe("For table " + testParams.table_name + ",", function() {

        var table, record;

        beforeAll(function() {
            var keys = [];
            keys.push(testParams.key.name + testParams.key.operator + testParams.key.value);
            browser.ignoreSynchronization=true;
            var url = browser.params.url + "/record/#" + browser.params.catalogId + "/product-record:" + testParams.table_name + "/" + keys.join("&");
            browser.get(url);
            table = browser.params.defaultSchema.content.tables[testParams.table_name];
            chaisePage.waitForElement(element(by.id('tblRecord')));
        });

        it("should load chaise-config.js and have deleteRecord=false, resolverImplicitCatalog=4", function() {
            browser.executeScript("return chaiseConfig;").then(function(chaiseConfig) {
                expect(chaiseConfig.deleteRecord).toBeFalsy();
                expect(chaiseConfig.resolverImplicitCatalog).toBe(4);
            });
        });

        it('should display a disabled delete record button', function() {
            var deleteBtn = chaisePage.recordPage.getDeleteRecordButton();
            chaisePage.waitForElement(deleteBtn);
            expect(deleteBtn.isPresent()).toBeTruthy("The delete button does not show on the page.");
            expect(deleteBtn.getAttribute("disabled")).toBeTruthy("The delete button was not disabled.");
        });

        it('Record Table of Contents panel should be hidden by default as chaiseConfig entry hideTableOfContents is true.', function(done){
            var recPan =  chaisePage.recordPage.getSidePanel(),
                showTocBtn = chaisePage.recordPage.getShowTocBtn();

            expect(showTocBtn.element(by.className("chaise-icon")).getAttribute("class")).toContain("chaise-sidebar-open", "Wrong icon for show toc button");
            expect(recPan.getAttribute("class")).toContain('close-panel', 'Side Panel is visible when it should NOT be');

            done();
        });

        // test RID search and resolverImplicitCatalog
        // NOTE: resolverImplicitCatalog=4 so locally catalog 4 does not exist and resolver should fail since no RID exists in catalog 4
        // in travis, resolver isn't configured
        it('should show an error dialog if an improper RID is typed into the RID search box', function (done) {
            var rid = chaisePage.getEntityRow("product-record", testParams.table_name, [{column: "id",value: "4004"}]).RID,
                pageUrl = browser.params.url + "/record/#" + browser.params.catalogId + "/product-record:" + testParams.table_name + "/RID=" + rid;

            element(by.id('rid-search-input')).sendKeys(rid);
            element(by.css('.rid-search .chaise-search-btn')).click().then(function () {
                // wait for modal to show
                chaisePage.waitForElement(element(by.css('.modal-dialog ')));

                expect(chaisePage.recordPage.getErrorModalTitle()).toBe("Record Not Found", "The title of no table error pop is not correct");

                var modalText = "The record does not exist or may be hidden.\nIf you continue to face this issue, please contact the system administrator.\n\nClick OK to dismiss this dialog.";
                expect(chaisePage.recordPage.getModalText().getText()).toBe(modalText, "The message in modal pop is not correct");

                return chaisePage.clickButton(chaisePage.recordPage.getErrorModalOkButton());
            }).then (function (){
                // should close modal and NOT change page
                return browser.driver.getCurrentUrl();
            }).then(function (currentUrl) {
                expect(currentUrl).toBe(pageUrl, "The OK button redirected instead of closing the modal");

                done();
            }).catch(function (err) {
                console.dir(err);
                done.fail();
            });
        });

        if (process.env.TRAVIS) {
            it ("Should have the proper permalink in the share popup if resolverImplicitCatalog is the same as catalogId", function (done) {
                var permalink = browser.params.origin+"/id/"+chaisePage.getEntityRow("product-record", testParams.table_name, [{column: "id",value: "4004"}]).RID;

                var shareButton = chaisePage.recordPage.getShareButton(),
                    shareModal = chaisePage.recordPage.getShareModal();

                shareButton.click().then(function () {
                    // wait for dialog to open
                    chaisePage.waitForElement(shareModal);

                    expect(chaisePage.recordPage.getPermalinkText().getText()).toBe(permalink, "permalink url is incorrect");

                    done();
                }).catch(function(err){
                    done.fail(err);
                });
            });
        }
    });
});
