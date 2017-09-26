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
        var addRecordLink = chaisePage.recordsetPage.getAddRecordLink();
        browser.wait(EC.presenceOf(addRecordLink), browser.params.defaultTimeout);

        addRecordLink.click().then(function() {
            // get the url from this tab..
            return browser.driver.getCurrentUrl();
        }).then(function(url) {

            var result = '/recordedit/#' + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name;
            expect(url.indexOf(result)).toBeGreaterThan(-1);
            return chaisePage.waitForElement(element(by.id('submit-record-button')));
        }).then(function() {
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
        });
    });

    // TODO: this test can be uncommented if we decide to navigate to a new tab for recordset add
    xit("go back to recordset should refresh the table with the new record", function() {
        // ... before closing this new tab and switching back to the original Record app's tab so that the next it spec can run properly
        browser.close();
        browser.switchTo().window(allWindows[0]).then(function() {
            return chaisePage.waitForElementInverse(element(by.id("spinner")));
        }).then(function() {
            return chaisePage.recordsetPage.getRows();
        }).then(function(rows) {
            expect(rows.length).toBe(rowCount+1);
        });
    }).pend("this is no longer the expected functionality. The page is changed in place and finishes at record app");

});
