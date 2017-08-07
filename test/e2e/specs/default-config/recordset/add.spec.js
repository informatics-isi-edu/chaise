var chaisePage = require('../../../utils/chaise.page.js');
var moment = require('moment');
var testParams = {
    schemaName: "product-recordset-add",
    table_name: "accommodation",
    title: "Best Western Plus Amedia Art Salzburg",
    rating: "3.50",
    summary: "The BEST WESTERN PLUS Amedia Art Salzburg is located near the traditional old part of town, near the highway, near the train station and close to the exhibition center of Salzburg.\nBEST WESTERN PLUS Amedia Art Salzburg offers harmony of modern technique and convenient atmosphere to our national and international business guest and tourists."
};

describe('Recordset add record,', function() {

    var rowCount, allWindows;;

    beforeAll(function () {
        browser.ignoreSynchronization = true;
        browser.get(browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name);
        chaisePage.waitForElement(element(by.id("divRecordSet"))).then(function() {
            return chaisePage.recordsetPage.getRows();
        }).then(function(rows) {
            rowCount = rows.length;
        });

    });

    it("click on the add button should open a new tab to recordedit", function() {

        var EC = protractor.ExpectedConditions;
        var e = element(by.id('add-record-btn'));
        browser.wait(EC.presenceOf(e), browser.params.defaultTimeout);

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

            chaisePage.waitForElement(element(by.id('submit-record-button'))).then(function() {
                // set the required fields
                return chaisePage.recordsetPage.getInputForAColumn("title")
            }).then(function(input) {
                input.sendKeys(testParams.title);
                return chaisePage.recordsetPage.getModalPopupBtn();
            }).then(function(btn) {
                return btn.click();
            }).then(function() {
                return chaisePage.waitForElement(element(by.id("divRecordSet")))
            }).then(function() {
                var rows = chaisePage.recordsetPage.getRows();
                return rows.get(0).all(by.css(".select-action-button"));
            }).then(function(selectButtons) {
                selectButtons[0].click();
            }).then(function() {
                return chaisePage.recordsetPage.getInputForAColumn("rating");
            }).then(function(input) {
                input.sendKeys(testParams.rating);
                return chaisePage.recordEditPage.getTextAreaForAcolumn("summary");
            }).then(function(input) {
                input.sendKeys(testParams.summary);
                var nowBtn = element.all(by.css('button[name="opened_on-now"]')).get(0);
                return nowBtn.click();
            }).then(function() {
                return chaisePage.recordEditPage.submitForm();
            }).then(function() {
                // wait until redirected to record page
                chaisePage.waitForElement(element(by.id("tblRecord")));
            })
        });
    });

    it("go back to recordset should refresh the table with the new record", function() {
        // ... before closing this new tab and switching back to the original Record app's tab so that the next it spec can run properly
        browser.close();
        browser.switchTo().window(allWindows[0]).then(function() {
            return chaisePage.waitForElementInverse(element(by.id("spinner")));
        }).then(function() {
            return chaisePage.recordsetPage.getRows();
        }).then(function(rows) {
            expect(rows.length).toBe(rowCount+1);
        });
    });

});
