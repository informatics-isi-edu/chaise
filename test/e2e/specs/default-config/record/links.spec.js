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

        if (!process.env.CI) {
            describe("regarding the export button, ", function () {
                var exportBtn;
                beforeAll(function () {
                    exportBtn = chaisePage.recordsetPage.getExportDropdown();
                    // delete files that may have been downloaded before
                    console.log("delete existing files");
                    recordSetHelpers.deleteDownloadedFiles(testParams.file_names);
                });

                it ("first option must be `This record (CSV)` and user should be able to download the file.", function (done) {
                    browser.wait(EC.elementToBeClickable(exportBtn));
                    chaisePage.clickButton(exportBtn).then(function () {
                        var csvOption = chaisePage.recordsetPage.getExportOption("This record (CSV)");
                        expect(csvOption.getText()).toBe("This record (CSV)");
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

                it ("second option must be default `BDBag` and user should be able to download the file.", function (done) {
                    var exportModal = chaisePage.recordsetPage.getExportModal();
                    browser.wait(EC.elementToBeClickable(exportBtn));
                    exportBtn.click().then(function () {
                        var bagOption = chaisePage.recordsetPage.getExportOption("BDBag");
                        expect(bagOption.getText()).toBe("BDBag");
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

                return chaisePage.recordsetPage.getModalCloseBtn().click();
            }).then(function () {
                done();
            }).catch(function(err){
                console.log(err);
                done.fail();
            });
        });

        it("Clicking the subtitle should redirect to recordset app", function(done) {
            var subtitleLink = chaisePage.recordPage.getEntitySubTitleLink();

            browser.wait(EC.elementToBeClickable(subtitleLink), browser.params.defaultTimeout);

            subtitleLink.click().then(function() {
                return browser.driver.getCurrentUrl();
            }).then(function(url) {
                expect(url.indexOf('recordset')).toBeGreaterThan(-1);

                chaisePage.recordsetPageReady();
                done();
            }).catch(function(err){
                console.log(err);
                done.fail();
            });
        });

        if (!process.env.CI) {
            // resolver is only configured to work locally
            it("Searching in go to RID input should navigate the user to the resolved record page matching that RID", function (done) {
                var rid = chaisePage.getEntityRow("links", testParams.table_name, [{column: "id",value: "1"}]).RID;

                element(by.id('rid-search-input')).sendKeys(rid);
                element(by.css('.rid-search .chaise-search-btn')).click().then(function () {
                    browser.wait(function() {
                        return browser.getAllWindowHandles().then(function(tabs) {
                            return (tabs.length == 2);
                        });
                    }, browser.params.defaultTimeout);

                    return browser.getAllWindowHandles();
                }).then(function (tabs) {
                    allWindows = tabs;

                    return browser.switchTo().window(allWindows[1]);
                }).then(function () {

                    return browser.driver.getCurrentUrl();
                }).then(function (url) {
                    var newTabUrl = "chaise/record/#" + browser.params.catalogId + "/links:" + testParams.table_name + "/RID=" + rid;

                    expect(url.indexOf(newTabUrl)).toBeGreaterThan(-1, "new tab url is not the right page");

                    done();
                }).catch(function (err) {
                    console.dir(err);
                    done.fail();
                });
            });
        }
    });
});
