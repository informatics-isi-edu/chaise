var chaisePage = require('../../../utils/chaise.page.js');
var testParams = {
    schemaName: "product-unordered-related-tables-actions",
    table_name: "accommodation",
    key: {
        name: "id",
        value: "2004",
        operator: "="
    },
    related_associate_table: "accommodation_image",
    related_linked_table: "file",
    related_linked_table_key_filter: "id=3009",
    related_regular_table: "booking",
    related_regular_table_key_filter: "accommodation_id=2004"
};

describe('View existing record,', function() {

    describe("For table " + testParams.table_name + ",", function() {

        beforeAll(function() {
            var keys = [];
            keys.push(testParams.key.name + testParams.key.operator + testParams.key.value);
            browser.ignoreSynchronization=true;
            var url = browser.params.url + "/record/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name + "/" + keys.join("&");
            browser.get(url);
            chaisePage.waitForElement(element(by.id('rt-accommodation_image')));
        });

        describe("Show the related entity tables,", function() {
            var allWindows;

            it("action columns should show view button that redirects to the record page", function() {
                var relatedTableName = testParams.related_associate_table; // association table
                var linkedToTableName = testParams.related_linked_table; // linked to table
                var linkedToTableFilter = testParams.related_linked_table_key_filter;

                chaisePage.recordPage.getRelatedTableRows(relatedTableName).then(function(rows) {
                    return rows[0].all(by.tagName("td"));
                }).then(function(cell){
                    return cell[0].all(by.css(".view-action-button"));
                }).then(function(actionButtons) {
                    return actionButtons[0].click();
                }).then(function() {
                    var result = '/record/#' + browser.params.catalogId + "/" + testParams.schemaName + ":" + linkedToTableName + "/" + linkedToTableFilter;
                    chaisePage.waitForUrl(result, browser.params.defaultTimeout).finally(function() {
                        expect(browser.driver.getCurrentUrl()).toContain(result);
                        browser.navigate().back();
                    });
                });
            });

            it("action columns should show edit button that redirects to the recordedit page", function() {

                var relatedTableName = testParams.related_regular_table;
                var relatedTableKey = testParams.related_regular_table_key_filter;

                var EC = protractor.ExpectedConditions;
                var e = element(by.id('rt-' + relatedTableName));
                browser.wait(EC.presenceOf(e), browser.params.defaultTimeout);

                chaisePage.recordPage.getRelatedTableRows(relatedTableName).then(function(rows) {
                    return rows[0].all(by.tagName("td"));
                }).then(function(cell) {
                    return cell[0].all(by.css(".edit-action-button"));
                }).then(function(editButtons) {
                    return chaisePage.clickButton(editButtons[0]);
                }).then(function() {
                    return browser.getAllWindowHandles();
                }).then(function(handles) {
                    allWindows = handles;
                    return browser.switchTo().window(allWindows[1]);
                }).then(function() {
                    var result = '/recordedit/#' + browser.params.catalogId + "/" + testParams.schemaName + ":" + relatedTableName + "/" + relatedTableKey;
                    expect(browser.driver.getCurrentUrl()).toContain(result);
                    browser.close();

                    return browser.switchTo().window(allWindows[0]);
                });
            });

            it("action columns should show delete button that deletes record", function() {
                var deleteButton;
                var relatedTableName = testParams.related_regular_table;
                var count, rowCells, oldValue;
                var relatedTableHeading = chaisePage.recordPage.getRelatedTableHeadingTitle(relatedTableName);
            
                var EC = protractor.ExpectedConditions;
                var e = element(by.id('rt-' + relatedTableName));
                browser.wait(EC.presenceOf(e), browser.params.defaultTimeout);
            
                var table = chaisePage.recordPage.getRelatedTable(relatedTableName);
            
                chaisePage.recordPage.getRelatedTableRows(relatedTableName).then(function(rows) {
                    count = rows.length;
                    return rows[count - 1].all(by.tagName("td"));
                }).then(function(cells) {
                    rowCells = cells;
                    return cells[1].getAttribute('innerHTML');
                }).then(function(cell) {
                    oldValue = cell;
                    return table.all(by.css(".delete-action-button"));
                }).then(function(deleteButtons) {
                    count = deleteButtons.length;
                    deleteButton = deleteButtons[0];
                    return chaisePage.clickButton(deleteButton);
                }).then(function() {
                    var EC = protractor.ExpectedConditions;
                    var confirmButton = chaisePage.recordPage.getConfirmDeleteButton();
                    browser.wait(EC.visibilityOf(confirmButton), browser.params.defaultTimeout);
            
                    return confirmButton.click();
                }).then(function() {
                    browser.wait(EC.stalenessOf(rowCells[1]), browser.params.defaultTimeout);
                    expect(relatedTableHeading.getText()).toBe("booking (showing all 5 results)", "Booking related table heading did not update");
                });
            });

            it("action columns should show unlink button that unlinks", function() {
                var deleteButton;
                var relatedTableName = testParams.related_associate_table;
                var count, rowCells, oldValue;
                var relatedTableHeading = chaisePage.recordPage.getRelatedTableHeadingTitle(relatedTableName);

                var table = chaisePage.recordPage.getRelatedTable(relatedTableName);

                chaisePage.recordPage.getRelatedTableRows(relatedTableName).then(function(rows) {
                    count = rows.length;
                    return rows[count - 1].all(by.tagName("td"));
                }).then(function(cells) {
                    rowCells = cells;
                    return cells[1].getAttribute('innerHTML');
                }).then(function(cell) {
                    oldValue = cell;
                    return table.all(by.css(".delete-action-button"))
                }).then(function(deleteButtons) {
                    var count = deleteButtons.length;
                    deleteButton = deleteButtons[count-1];
                    return chaisePage.clickButton(deleteButton);
                }).then(function() {
                    var EC = protractor.ExpectedConditions;
                    var confirmButton = chaisePage.recordPage.getConfirmDeleteButton();
                    browser.wait(EC.visibilityOf(confirmButton), browser.params.defaultTimeout);

                    return confirmButton.click();
                }).then(function() {
                    browser.wait(function() {return rowCells[1].getAttribute('innerHTML') !== oldValue}, browser.params.defaultTimeout);
                    expect(relatedTableHeading.getText()).toBe("accommodation_image (showing first 2 results)", "Accomodation image related table heading did not update");
                });
            });
        });
    });
});
