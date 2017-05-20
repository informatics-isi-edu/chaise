var chaisePage = require('../../../utils/chaise.page.js');

describe('View existing record,', function() {

    var testConfiguration = browser.params.configuration.tests, testParams = testConfiguration.params;

    for (var i=0; i< testParams.tuples.length; i++) {

        (function(tupleParams, index) {

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
                    table = browser.params.defaultSchema.content.tables[tupleParams.table_name];
                    chaisePage.waitForElement(element(by.id('tblRecord')));
                });

                describe("Show the related entity tables,", function() {
                    var allWindows;

                    it("action columns should show view button that redirects to the record page", function() {

                        var relatedTableName = tupleParams.related_associate_table; // association table
                        var linkedToTableName = tupleParams.related_linked_table; // linked to table
                        var linkedToTableFilter = tupleParams.related_linked_table_key_filter;

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

                        var relatedTableName = tupleParams.related_regular_table;
                        var relatedTableKey = tupleParams.related_regular_table_key_filter;

                        var EC = protractor.ExpectedConditions;
                        var e = element(by.id('rt-' + relatedTableName));
                        browser.wait(EC.presenceOf(e), browser.params.defaultTimeout);

                        chaisePage.recordPage.getRelatedTableRows(relatedTableName).then(function(rows) {
                            return rows[0].all(by.tagName("td"));
                        }).then(function(cell) {
                            return cell[0].all(by.css(".edit-action-button"));
                        }).then(function(editButtons) {
                            browser.sleep(1000);
                            return editButtons[0].click();
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
                        var relatedTableName = tupleParams.related_regular_table;
                        var count, rowCells, oldValue;

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
                            deleteButton = deleteButtons[count-1];
                            return deleteButton.click();
                        }).then(function() {
                            var EC = protractor.ExpectedConditions;
                            var confirmButton = chaisePage.recordPage.getConfirmDeleteButton();
                            browser.wait(EC.visibilityOf(confirmButton), browser.params.defaultTimeout);

                            return confirmButton.click();
                        }).then(function() {
                            browser.wait(EC.stalenessOf(rowCells[1]), browser.params.defaultTimeout);
                        });
                    });

                    it("action columns should show unlink button that unlinks", function() {
                        var deleteButton;
                        var relatedTableName = tupleParams.related_associate_table;
                        var count, rowCells, oldValue;

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
                            return deleteButton.click();
                        }).then(function() {
                            var EC = protractor.ExpectedConditions;
                            var confirmButton = chaisePage.recordPage.getConfirmDeleteButton();
                            browser.wait(EC.visibilityOf(confirmButton), browser.params.defaultTimeout);

                            return confirmButton.click();
                        }).then(function() {
                            browser.wait(function() {return rowCells[1].getAttribute('innerHTML') !== oldValue}, browser.params.defaultTimeout);
                        })
                    });
                });
            });
        })(testParams.tuples[i], i);
    }
});
