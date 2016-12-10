var chaisePage = require('../../../utils/chaise.page.js');
var moment = require('moment');

describe('Recordset add record,', function() {

    var testConfiguration = browser.params.configuration.tests, testParams = testConfiguration.params;
    var rowCount, allWindows;;

    beforeAll(function () {
        browser.ignoreSynchronization = true;
        browser.get(browser.params.url + ":" + testParams.table_name);
        browser.sleep(3000);

        chaisePage.recordsetPage.getRows().then(function(rows) {
            rowCount = rows.length;
        });
    });


    it("click on the add button should open a new tab to recordedit", function(done) {

        var EC = protractor.ExpectedConditions;
        var e = element(by.id('add-record-btn'));
        browser.wait(EC.presenceOf(e), 2000);

        chaisePage.recordsetPage.getAddRecordButton().click().then(function() {
            // This Add link opens in a new tab so we have to track the windows in the browser...
            return browser.getAllWindowHandles();
        }).then(function(handles) {
            allWindows = handles;
            // ... and switch to the new tab here...
            return browser.switchTo().window(allWindows[1]);
        }).then(function() {
            // ... and then get the url from this new tab...
            return browser.driver.getCurrentUrl();
        }).then(function(url) {

            var result = '/recordedit/#' + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name;
            expect(url.indexOf(result)).toBeGreaterThan(-1);


            // set the required fields
            browser.sleep(1000);
            chaisePage.recordsetPage.getInputForAColumn("title").then(function(input) {

                input.sendKeys(testParams.title);
                return chaisePage.recordsetPage.getModalPopupBtn();

            }).then(function(btn) {
                return btn.click();
            }).then(function() {
                browser.sleep(1000);
                var rows = chaisePage.recordsetPage.getRows();
                return rows.get(0).click();
            }).then(function() {
                return chaisePage.recordsetPage.getInputForAColumn("rating");
            }).then(function(input) {
                input.sendKeys(testParams.rating);
                return chaisePage.recordEditPage.getTextAreaForAcolumn("summary");
            }).then(function(input) {
                input.sendKeys(testParams.summary);
                var nowBtn = element.all(by.css('button[name="opened_on"]')).get(1);
                return nowBtn.click();
            }).then(function() {
                return chaisePage.recordEditPage.submitForm();
            }).then(function() {
                // wait until redirected to record page
                var EC = protractor.ExpectedConditions,
                    title = chaisePage.recordPage.getEntityTitleElement();
                browser.wait(EC.presenceOf(title), 10000);
                done();
            });

        });
    });

    it("go back to recordset should refresh the table with the new record", function() {
        // ... before closing this new tab and switching back to the original Record app's tab so that the next it spec can run properly
        browser.close();
        browser.switchTo().window(allWindows[0]);
        browser.sleep(1000);

        chaisePage.recordsetPage.getRows().then(function(rows) {
            expect(rows.length).toBe(rowCount+1);
        });
    });

});
