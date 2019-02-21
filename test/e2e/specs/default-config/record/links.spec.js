var chaisePage = require('../../../utils/chaise.page.js');
var EC = protractor.ExpectedConditions;
var fs = require('fs');
var recordSetHelpers = require('../../../utils/recordset-helpers.js');
var testParams = {
    table_name: "links-table",
    key: {
        name: "id",
        value: "1",
        operator: "="
    },
    file_names: [
        "links-table.csv",
        "links-table_" + chaisePage.getEntityRow("links", "links-table", [{column: "id",value: "1"}]).RID + ".zip"
    ]
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

        if (!process.env.TRAVIS) {
            describe("regadring the export button, ", function () {
                var exportBtn;
                beforeAll(function () {
                    exportBtn = chaisePage.recordsetPage.getExportDropdown();
                    // delete files that may have been downloaded before
                    console.log("delete existing files");
                    recordSetHelpers.deleteDownloadedFiles(testParams.file_names);
                });

                it ("first option must be `CSV` and user should be able to download the file.", function (done) {
                    browser.wait(EC.elementToBeClickable(exportBtn));
                    chaisePage.clickButton(exportBtn).then(function () {
                        var csvOption = chaisePage.recordsetPage.getExportOption("CSV");
                        expect(csvOption.getText()).toBe("CSV");
                        return chaisePage.clickButton(csvOption);
                    }).then(function () {
                        browser.wait(function() {
                            return fs.existsSync(process.env.PWD + "/test/e2e/" + testParams.file_names[0]);
                        }, browser.params.defaultTimeout).then(function () {
                            done();
                        }, function () {
                            done.fail("csv was not downloaded");
                        });
                    }).catch(function (err) {
                        done.fail(err);
                    });
                });

                it ("second option must be default `BAG` and user should be able to download the file.", function (done) {
                    var exportModal = chaisePage.recordsetPage.getExportModal();
                    browser.wait(EC.elementToBeClickable(exportBtn));
                    exportBtn.click().then(function () {
                        var bagOption = chaisePage.recordsetPage.getExportOption("BAG");
                        expect(bagOption.getText()).toBe("BAG");
                        return bagOption.click();
                    }).then(function () {
                        return chaisePage.waitForElement(exportModal);
                    }).then(function () {
                        exportModal.allowAnimations(false);
                        return chaisePage.waitForElementInverse(exportModal);
                    }).then(function () {
                        browser.wait(function() {
                            return fs.existsSync(process.env.PWD + "/test/e2e/" + testParams.file_names[1]);
                        }, browser.params.defaultTimeout).then(function () {
                            done();
                        }, function () {
                            done.fail("bag was not downloaded");
                        });
                    }).catch(function (err) {
                        done.fail(err);
                    });
                });

                afterAll(function() {
                    // delete files that have been downloaded during tests
                    console.log("delete created files");
                    recordSetHelpers.deleteDownloadedFiles(testParams.file_names);
                });
            });
        }

        it ("The proper permalink (browser url) should appear in the share popup if resolverImplicitCatalog is undefined", function (done) {
            var shareButton = chaisePage.recordPage.getShareButton(),
                shareModal = chaisePage.recordPage.getShareModal();

            browser.wait(EC.elementToBeClickable(shareButton));
            chaisePage.clickButton(shareButton).then(function () {
                // wait for dialog to open
                chaisePage.waitForElement(shareModal);
                // disable animations in modal so that it doesn't "fade out" (instead it instantly disappears when closed) which we can't track with waitFor conditions
                shareModal.allowAnimations(false);

                return browser.getCurrentUrl();
            }).then(function (url) {
                // change url
                var permalink = browser.params.origin+"/id/"+browser.params.catalogId+"/"+chaisePage.getEntityRow("links", testParams.table_name, [{column: "id",value: "1"}]).RID;
                expect(chaisePage.recordPage.getPermalinkText().getText()).toBe(permalink, "permalink url is incorrect");

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
