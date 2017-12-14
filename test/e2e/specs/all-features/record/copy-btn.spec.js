var chaisePage = require('../../../utils/chaise.page.js');
var testParams = {
    table_name: "editable-id-table",
    table_displayname: "Editable Id Table",
    table_inner_html_display: "<strong>Editable Id Table</strong>",
    entity_title: "1",
    entity_inner_html_title: "<strong>1</strong>",
    html_table_name: "html-name-table",
    html_table_display: "<strong>Html Name</strong>",
    keys: [{"name": "id", "value": 1, "operator": "="}],
    html_keys: [{"name": "id", "value": 1, "operator": "="}]
};

var relatedTableTestParams = {
    table_name: "accommodation",
    key: {
        name: "id",
        value: "2002",
        operator: "="
    },
};

describe('View existing record,', function() {

    describe("For table " + relatedTableTestParams.table_name + ",", function() {

        // this test is for verifying the related tables option, maxRelatedTablesOpen
        beforeAll(function() {
            var keys = [];
            browser.ignoreSynchronization = true;
            keys.push(relatedTableTestParams.key.name + relatedTableTestParams.key.operator + relatedTableTestParams.key.value);
            var url = browser.params.url + "/record/#" + browser.params.catalogId + "/product-max-RT:" + relatedTableTestParams.table_name + "/" + keys.join("&");
            browser.get(url);
            chaisePage.waitForElement(chaisePage.recordPage.getEntityTitleElement(), browser.params.defaultTimeout);
        });

        it("should load chaise-config.js and have maxRelatedTablesOpen=5", function() {
            browser.executeScript("return chaiseConfig;").then(function(chaiseConfig) {
                expect(chaiseConfig.maxRelatedTablesOpen).toBe(5);
            });
        });

        it('should collapse related tables after it exceeds the maxRelatedTablesOpen value',function(){
            expect(element.all(by.css('.panel-open')).count()).toEqual(0);
        });
    });

    // below are the tests for the copy button
    describe("For table " + testParams.html_table_name + ",", function() {
        beforeAll(function() {
            var keys = [];
            testParams.html_keys.forEach(function(key) {
                keys.push(key.name + key.operator + key.value);
            });
            browser.ignoreSynchronization=true;
            var url = browser.params.url + "/record/#" + browser.params.catalogId + "/editable-id:" + testParams.html_table_name + "/" + keys.join("&");
            browser.get(url);
            chaisePage.waitForElement(element(by.id('tblRecord')));
        });

        it("should display the entity subtitle name with html in it.", function() {
            expect(chaisePage.recordPage.getEntitySubTitle()).toBe(testParams.html_table_display);
        });
    });

    describe("For table " + testParams.table_name + ",", function() {

        var table, record;

        beforeAll(function() {
            var keys = [];
            testParams.keys.forEach(function(key) {
                keys.push(key.name + key.operator + key.value);
            });
            browser.ignoreSynchronization=true;
            var url = browser.params.url + "/record/#" + browser.params.catalogId + "/editable-id:" + testParams.table_name + "/" + keys.join("&");
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
                    expect(html).toBe(testParams.table_inner_html_display);
                    expect(chaisePage.recordPage.getEntitySubTitle()).toBe(testParams.table_displayname);

                    return titleElement.getAttribute("innerHTML");
                }).then(function(html) {
                    expect(html).toBe(testParams.entity_inner_html_title);
                    expect(chaisePage.recordPage.getEntityTitle()).toBe(testParams.entity_title);
                });
            });

            it("should show when the page loads.", function() {
                browser.wait(EC.elementToBeClickable(copyButton), browser.params.defaultTimeout);

                copyButton.isDisplayed().then(function (bool) {
                    expect(bool).toBeTruthy();
                });
            });

            it("should not show Loading... text when there are no related tables.", function() {
                element(by.id('rt-loading')).isDisplayed().then(function (displayed) {
                    expect(displayed).toBeFalsy();
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
                    expect(txt).toBe("Create " + testParams.table_displayname +" Record");

                    return titleElement.element(by.css('span[ng-bind-html]')).getAttribute("innerHTML");
                }).then(function(html) {
                    expect(html).toBe(testParams.table_inner_html_display);

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
                    expect(text.indexOf("collides with existing entity")).toBeGreaterThan(-1, "Text for conflict error is not correct");
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
