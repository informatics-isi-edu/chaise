var chaisePage = require('../../../utils/chaise.page.js');
var recordHelpers = require('../helpers.js');

describe('View existing record,', function() {

    var params, testConfiguration = browser.params.configuration.tests, tupleParams = testConfiguration.params.tuples[0];

    describe("For table " + tupleParams.html_table_name + ",", function() {
        beforeAll(function() {
            var keys = [];
            tupleParams.html_keys.forEach(function(key) {
                keys.push(key.name + key.operator + key.value);
            });
            browser.ignoreSynchronization=true;
            var url = browser.params.url + ":" + tupleParams.html_table_name + "/" + keys.join("&");
            browser.get(url);
            chaisePage.waitForElement(element(by.id('tblRecord')));
        });

        it("should display the entity subtitle name with html in it.", function() {
            expect(chaisePage.recordPage.getEntitySubTitle()).toBe(tupleParams.html_table_display);
        });
    });

    describe("For table " + tupleParams.table_name + ",", function() {

        var table, record;

        beforeAll(function() {
            var keys = [];
            tupleParams.keys.forEach(function(key) {
                keys.push(key.name + key.operator + key.value);
            });
            browser.ignoreSynchronization=true;
            var url = browser.params.url + ":" + tupleParams.table_name + "/" + keys.join("&");
            browser.get(url);
            chaisePage.waitForElement(element(by.id('tblRecord')));
        });

        it("should load chaise-config.js and have editRecord=true", function() {
            browser.executeScript("return chaiseConfig;").then(function(chaiseConfig) {
                expect(chaiseConfig.editRecord).toBe(true);
            });
        });

        describe("for the copy record button,", function() {
            var EC = protractor.ExpectedConditions,
                copyButton = chaisePage.recordPage.getCopyRecordButton();

            it("should display the entity title and subtitle based on their markdown patterns.", function() {
                var subtitleElement = chaisePage.recordPage.getEntitySubTitleElement().element(by.tagName("span")),
                    titleElement = chaisePage.recordPage.getEntityTitleElement().element(by.tagName("span"));

                subtitleElement.getAttribute("innerHTML").then(function(html) {
                    expect(html).toBe(tupleParams.table_inner_html_display);
                    expect(chaisePage.recordPage.getEntitySubTitle()).toBe(tupleParams.table_displayname);

                    return titleElement.getAttribute("innerHTML");
                }).then(function(html) {
                    expect(html).toBe(tupleParams.entity_inner_html_title);
                    expect(chaisePage.recordPage.getEntityTitle()).toBe(tupleParams.entity_title);
                });
            });

            it("should show when the page loads.", function() {
                browser.wait(EC.elementToBeClickable(copyButton), browser.params.defaultTimeout);
                copyButton.isDisplayed().then(function (bool) {
                    expect(bool).toBeTruthy();
                });
            });

            it("should redirect to recordedit when clicked.", function() {
                var titleElement = chaisePage.recordEditPage.getEntityTitleElement();

                copyButton.click().then(function() {
                    return chaisePage.waitForElement(element(by.id('submit-record-button')));
                }).then(function() {
                    return browser.driver.getCurrentUrl();
                }).then(function(url) {
                    expect(url.indexOf('recordedit')).toBeGreaterThan(-1);

                    return titleElement.getText();
                }).then(function(txt) {
                    expect(txt).toBe("Create 1 Record");

                    return titleElement.element(by.css('span[ng-bind-html]')).getAttribute("innerHTML");
                }).then(function(html) {
                    expect(html).toBe(tupleParams.entity_inner_html_title);

                    return chaisePage.recordEditPage.getForms().count();
                }).then(function(ct) {
                    // only 1 row is copied at this time
                    expect(ct).toBe(1);
                }).catch(function(error) {
                    console.log(error);
                    expect('There was an error.').toBe('Please check the error message.');
                });
            });

            it("should have 'Automatically Generated' in an input that is generated rather than copying the value from the copied record.", function() {
                chaisePage.recordEditPage.getInputById(0, "generated").getAttribute("placeholder").then(function (text) {
                    expect(text).toBe("Automatically generated");
                });
            });

            it("should alert the user if trying to submit data without changing the id.", function() {
                chaisePage.recordEditPage.submitForm();
                browser.wait(function() {
                    return chaisePage.recordEditPage.getAlertError();
                }, browser.params.defaultTimeout).then(function(error) {
                    return error.getText();
                }).then(function(text) {
                    expect(text.indexOf("409 Conflict")).toBeGreaterThan(-1);
                });
            });

            it("should redirect to record after changing the id and resubmitting.", function() {
                var idInput = chaisePage.recordEditPage.getInputById(0, "id");
                idInput.clear();
                idInput.sendKeys("777");
                chaisePage.recordEditPage.submitForm();
                browser.driver.getCurrentUrl().then(function(url) {
                    expect(url.indexOf("record")).toBeGreaterThan(-1);
                });
            });
        });

    });

});
