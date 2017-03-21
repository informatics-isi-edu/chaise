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
                // browser.wait(function() {
                //     return chaisePage.recordsetPage.getRows().get(0).getText().then(function(text) {
                //         return (text.indexOf("Four Points Sherathon 2") > -1);
                //     });
                // }, browser.params.defaultTimeout);
                browser.sleep(500);

                return previousBtn.click();
            }).then(function() {
                //wait for it to be on the first page again
                // browser.wait(EC.not(EC.elementToBeClickable(previousBtn)), browser.params.defaultTimeout);
                browser.sleep(500);

                return chaisePage.recordsetPage.getPageLimitDropdown().click();
            }).then(function() {
                // increase the page limit
                return chaisePage.recordsetPage.getPageLimitSelector(fileParams.page_size).click();
            }).then(function() {
                // verify more records are now shown
                return chaisePage.recordsetPage.getRows().count();
            }).then(function(ct) {
                expect(ct).toBe(fileParams.page_size);
            });
        });
    });

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

});
