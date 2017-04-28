var recordsetHelpers = require('../helpers.js'), chaisePage = require('../../../utils/chaise.page.js');;

describe('View recordset,', function() {

    var testConfiguration = browser.params.configuration.tests, testParams = testConfiguration.params, fileParams = testParams.file_tuple;

    for (var i=0; i< testParams.tuples.length; i++) {

        (function(tupleParams, index) {

            describe("For table " + tupleParams.table_name + ",", function() {

                beforeAll(function () {
                    var keys = [];
                    tupleParams.keys.forEach(function(key) {
                        keys.push(key.name + key.operator + key.value);
                    });
                    browser.ignoreSynchronization=true;
                    browser.get(browser.params.url + ":" + tupleParams.table_name + "/" + keys.join("&") + "@sort(" + tupleParams.sortby + ")");

                    chaisePage.waitForElement(element(by.id("divRecordSet")));
                });

                describe("Presentation ,", function() {
                    var params = recordsetHelpers.testPresentation(tupleParams);
                });

            });

        })(testParams.tuples[i], i);


    }

    describe("For table " + fileParams.table_name + ',', function() {
        var EC = protractor.ExpectedConditions;

        beforeAll(function () {
            browser.ignoreSynchronization = true;
            browser.get(browser.params.url + ':' + fileParams.table_name);
        });

        it("should load the table with " + fileParams.custom_page_size + " rows of data based on the page size annotation.", function() {
            // Verify page count and on first page
            var e = element(by.id("custom-page-size"));

            browser.wait(EC.presenceOf(e), browser.params.defaultTimeout).then(function() {
                return chaisePage.recordsetPage.getRows().count();
            }).then(function(ct) {
                expect(ct).toBe(fileParams.custom_page_size);
            });
        });

        it("should have " + fileParams.page_size + " rows after paging to the second page, back to the first, and then changing page size to " + fileParams.page_size + ".", function() {
            var previousBtn = chaisePage.recordsetPage.getPreviousButton();
            // page to the next page then page back to the first page so the @before modifier is applied
            chaisePage.recordsetPage.getNextButton().click().then(function() {
                // wait for it to be on the second page
                browser.wait(EC.elementToBeClickable(previousBtn), browser.params.defaultTimeout);

                return previousBtn.click();
            }).then(function() {
                //wait for it to be on the first page again
                browser.wait(EC.not(EC.elementToBeClickable(previousBtn)), browser.params.defaultTimeout);

                return chaisePage.recordsetPage.getPageLimitDropdown().click();
            }).then(function() {
                // increase the page limit
                return chaisePage.recordsetPage.getPageLimitSelector(fileParams.page_size).click();
            }).then(function() {
                browser.wait(function() {
                    return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                        return (ct == 10);
                    });
                }, browser.params.defaultTimeout);

                // verify more records are now shown
                return chaisePage.recordsetPage.getRows().count();
            }).then(function(ct) {
                expect(ct).toBe(fileParams.page_size);
            });
        });
    });

    describe("For chaise config properties", function () {
        var EC = protractor.ExpectedConditions;

        it('should load custom CSS and document title defined in chaise-config.js', function() {
            var chaiseConfig, tupleParams = testParams.tuples[0], keys = [];
            tupleParams.keys.forEach(function(key) {
                keys.push(key.name + key.operator + key.value);
            });
            var url = browser.params.url + ":" + tupleParams.table_name + "/" + keys.join("&") + "@sort(" + tupleParams.sortby + ")";
            browser.get(url);
            chaisePage.waitForElement(element(by.id('page-title')), browser.params.defaultTimeout).then(function() {
                return browser.executeScript('return chaiseConfig');
            }).then(function(config) {
                chaiseConfig = config;
                return browser.executeScript('return $("link[href=\'' + chaiseConfig.customCSS + '\']")');
            }).then(function(elemArray) {
                expect(elemArray.length).toBeTruthy();
                return browser.getTitle();
            }).then(function(title) {
                expect(title).toEqual(chaiseConfig.headTitle);
            }).catch(function(error) {
                console.log('ERROR:', error);
                // Fail the test
                expect('There was an error in this promise chain.').toBe('See the error msg for more info.');
            });
        });

        describe("For when no catalog or schema:table is specified,", function() {
            var baseUrl;

            beforeAll(function () {
                browser.ignoreSynchronization = true;
            });

            if (!process.env.TRAVIS) {
                it("should use the default catalog and schema:table defined in chaise config if no catalog or schema:table is present in the uri.", function() {
                    browser.get(process.env.CHAISE_BASE_URL + "/recordset");

                    chaisePage.waitForElement(chaisePage.recordsetPage.getPageLimitDropdown(), browser.params.defaultTimeout).then(function() {
                        return chaisePage.recordsetPage.getPageTitleElement().getText();
                    }).then(function (title) {
                        expect(title).toBe("Dataset");
                    });
                });

                it("should use the default schema:table defined in chaise config if no schema:table is present in the uri.", function() {
                    browser.get(process.env.CHAISE_BASE_URL + "/recordset/#1");

                    chaisePage.waitForElement(chaisePage.recordsetPage.getPageLimitDropdown(), browser.params.defaultTimeout).then(function() {
                        return chaisePage.recordsetPage.getPageTitleElement().getText();
                    }).then(function (title) {
                        expect(title).toBe("Dataset");
                    });
                });
            }

            it("should throw a malformed URI error when no default schema:table is set for a catalog.", function() {
                browser.get(process.env.CHAISE_BASE_URL + "/recordset/#" + browser.params.catalogId);

                var modalTitle = chaisePage.recordEditPage.getModalTitle();

                chaisePage.waitForElement(modalTitle, browser.params.defaultTimeout).then(function() {
                    return modalTitle.getText();
                }).then(function (title) {
                    expect(title).toBe("Error: MalformedUriError");
                });
            });
        });
    });

});
