// TODO can be combined with recordset/edit.spec.js
var chaisePage = require('../../../utils/chaise.page.js');
var moment = require('moment');
var testParams = {
    schemaName: "product-recordset-add",
    table_name: "accommodation",
    num_rows: 6,
    title: "Best Western Plus Amedia Art Salzburg",
    rating: "3.50",
    summary: "The BEST WESTERN PLUS Amedia Art Salzburg is located near the traditional old part of town, near the highway, near the train station and close to the exhibition center of Salzburg.\nBEST WESTERN PLUS Amedia Art Salzburg offers harmony of modern technique and convenient atmosphere to our national and international business guest and tourists."
};

describe('Recordset add record,', function() {

    var  allWindows;;

    beforeAll(function () {
        chaisePage.navigate(browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name);
        chaisePage.recordsetPageReady();
    });

    
    it("show an inline comment instead of tooltip", function () {
        expect(chaisePage.recordsetPage.getPageTitleInlineComment().getText()).toBe("Recordset inline comment", "inline comment is not shown or is incorrect");
    });

    it("verify the text is truncated properly based on the default config, then not truncated after clicking 'more'", function (done) {
        // default config: maxRecordsetRowHeight = 160
        // 160 for max height, 10 for padding
        var testCell, cellHeight = 170;
        chaisePage.recordsetPage.getRows().then(function (rows) {
            return chaisePage.recordsetPage.getRowCells(rows[0]);
        }).then(function (cells) {
            testCell = cells[4];
            expect(testCell.getText()).toContain("... more");

            return testCell.getSize();
        }).then(function (dimensions) {
            // the calculations might be one pixel off
            expect(Math.abs(dimensions.height - cellHeight) <= 1).toBeTruthy();
            return testCell.element(by.css(".readmore")).click();
        }).then(function () {
            expect(testCell.getText()).toContain("... less");

            return testCell.getSize();
        }).then(function (tallerDimensions) {
            expect(tallerDimensions.height).toBeGreaterThan(cellHeight);
            done();
        }).catch(function (err) {
            console.log(err);
            done.fail(err);
        });
    });

    it("verify view details link, search for a term, then verify view details link has changed", function () {
        var baseUrl = '/record/#' + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name + "/RID=";

        chaisePage.recordsetPage.getRows().then(function (rows) {
            var dataRow = browser.params.entities[testParams.schemaName][testParams.table_name].find(function (entity) {
                return entity.id == 2003;
            });
            // get first row view details button
            expect(rows[0].element(by.css('.view-action-button')).getAttribute("href")).toContain(baseUrl + dataRow.RID, "View button url is incorrect before searching set");

            // search for a row that is not the first one after sorting
            chaisePage.recordsetPage.getMainSearchInput().sendKeys('hilton');
            return chaisePage.recordsetPage.getSearchSubmitButton().click();
        }).then(function() {
            chaisePage.recordsetPage.waitForInverseMainSpinner();
            browser.wait(function () {
                return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                    return (ct == 1)
                });
            });
            return chaisePage.recordsetPage.getRows();
        }).then(function(rows) {
            expect(rows.length).toBe(1);

            var dataRow = browser.params.entities[testParams.schemaName][testParams.table_name].find(function (entity) {
                return entity.id == 4004;
            });
            // get first row view details button
            expect(rows[0].element(by.css('.view-action-button')).getAttribute("href")).toContain(baseUrl + dataRow.RID, "View button url is incorrect after searching set");

            // clear search
            return chaisePage.recordsetPage.getSearchClearButton().click();
        });
    });

    var allWindows;
    it("click on the add button should open a new tab to recordedit", function(done) {
        var rows;
        var EC = protractor.ExpectedConditions;
        var addRecordLink = chaisePage.recordsetPage.getAddRecordLink();
        browser.wait(EC.presenceOf(addRecordLink), browser.params.defaultTimeout);

        addRecordLink.click().then(function() {
            return browser.getAllWindowHandles();
        }).then(function (handles) {
            allWindows = handles;
            return browser.switchTo().window(allWindows[1]);
        }).then(function () {
            chaisePage.waitForElement(element(by.id('submit-record-button')));
            return browser.driver.getCurrentUrl();
        }).then(function (url) {

            var recordeditUrl = '/recordedit/#' + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name;
            expect(url).toContain(recordeditUrl, "url missmatch");

            // set the required fields
            return chaisePage.recordsetPage.getInputForAColumn("title");
        }).then(function(input) {
            input.sendKeys(testParams.title);
            return chaisePage.recordsetPage.getModalPopupBtn();
        }).then(function(btn) {
            return btn.click();
        }).then(function() {
            return chaisePage.recordsetPageReady();
        }).then(function() {
            rows = chaisePage.recordsetPage.getRows();

            return browser.wait(function () {
                return rows.count().then(function (ct) {
                    return (ct == 5)
                });
            });
        }).then(function () {
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
            done();
        }).catch(function (err) {
            done.fail(err);
        })
    });

    it("go back to recordset should refresh the table with the new record", function() {
        // ... before closing this new tab and switching back to the original Record app's tab so that the next it spec can run properly
        /**
         * we noticed this test case started failing on saucelabs,
         * that's why we're switching tabs twice to ensure the onfocus is getting called.
         */
        browser.switchTo().window(allWindows[0]).then(function() {
            return browser.switchTo().window(allWindows[1]);
        }).then(function () {
            return browser.switchTo().window(allWindows[0]);
        }).then(function () {
            return chaisePage.waitForElementInverse(element(by.id("spinner")));
        }).then(function() {
            return chaisePage.recordsetPage.getPageTitleElement().click();
        }).then(function () {
            return browser.wait(function() {
                return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                    return (ct == testParams.num_rows+1);
                });
            }, browser.params.defaultTimeout);
        }).then(function () {
            return chaisePage.recordsetPage.getRows();
        }).then(function(rows) {
            expect(rows.length).toBe(testParams.num_rows+1);
        });
    })

});
