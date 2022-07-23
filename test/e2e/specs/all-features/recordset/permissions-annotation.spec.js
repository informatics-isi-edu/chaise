// The goal of this spec is to test whether Recordset app correctly displays the right UI controls based on annotation
var chaisePage = require('../../../utils/chaise.page.js');
var recordsetPage = chaisePage.recordsetPage;
var testParams = {
    key: {
        columnName: "id",
        value: 1,
        operator: "="
    },
    tooltip:{
        viewCol: "Click on the icon to view the detailed page associated with each record"
    }
};

describe('When viewing Recordset app', function() {
    var EC = protractor.ExpectedConditions, url;
    beforeAll(function() {
        url = browser.params.url + "/recordset/#" + browser.params.catalogId + "/multi-permissions";
    });

    describe('for a read-only table', function() {
        beforeAll(function() {
            chaisePage.navigate(url + ':main_read_table/' + testParams.key.columnName + testParams.key.operator + testParams.key.value);
            chaisePage.recordsetPageReady();
        });

        it('should not display the add record [+] button', function() {
            var button = recordsetPage.getAddRecordLink();
            expect(button.isPresent()).toBe(false);
        });

        it('should not display the Edit link', function() {
            var link = recordsetPage.getEditRecordLink();
            expect(link.isPresent()).toBe(false);
        });

        describe('the action column', function() {
            it("should display 'View' as the column header", function() {
                expect(element.all(by.tagName('th')).get(0).getText()).toBe("View");
            });

            it("should have the correct tooltip", function(){
                var viewCol = element(by.css('.actions-header')).element(by.tagName("span"));

                // hover over pageTitle
                browser.actions().mouseMove(viewCol).perform();

                var tooltip = chaisePage.getTooltipDiv();
                chaisePage.waitForElement(tooltip).then(function () {
                    expect(tooltip.getText()).toBe(testParams.tooltip.viewCol);
                    // move cursor to hide tooltip
                    browser.actions().mouseMove(chaisePage.recordsetPage.getTotalCount()).perform();
                }).catch(function (err) {
                    console.log(err);
                });
            });

            it('should display the view button', function() {
                var button = recordsetPage.getViewActionButtons().first();
                // There's only 1 button because the table only has 1 row
                chaisePage.waitForElement(button).then(function(){
                expect(button.isDisplayed()).toBe(true);
              });
                // The test for whether it links to the correct url is tested in Recordset app tests.
            });

            it('should not display the edit button', function() {
                var button = recordsetPage.getEditActionButtons().first();
                // There's only 1 button because the table only has 1 row
                expect(button.isPresent()).toBe(false);
                // The test for whether it links to the correct url is tested in Recordset app tests.
            });

            it('should not display the delete button', function() {
                var button = recordsetPage.getDeleteActionButtons().first();
                // There's only 1 button because the table only has 1 row
                expect(button.isPresent()).toBe(false);
                // The test for whether it links to the correct url is tested in Recordset app tests.
            });
        });
    });

    describe('for a create-only table', function() {
        beforeAll(function() {
            chaisePage.refresh(url + ':main_create_table/' + testParams.key.columnName + testParams.key.operator + testParams.key.value);
            chaisePage.recordsetPageReady();
        });

        it('should display the add record [+] button', function() {
            var button = recordsetPage.getAddRecordLink();
            chaisePage.waitForElement(button).then(function(){
            expect(button.isDisplayed()).toBe(true);
          });
        });

        it('should not display the Edit link', function() {
            var link = recordsetPage.getEditRecordLink();
            expect(link.isPresent()).toBe(false);
        });

        describe('the action column', function() {
            it("should display 'View' as the column header", function() {
                expect(element.all(by.tagName('th')).get(0).getText()).toBe("View");
            });

            it('should display the view button', function() {
                var button = recordsetPage.getViewActionButtons().first();
                // There's only 1 button because the table only has 1 row
                expect(button.isDisplayed()).toBe(true);
                // The test for whether it links to the correct url is tested in Recordset app tests.
            });

            it('should not display the edit button', function() {
                var button = recordsetPage.getEditActionButtons().first();
                // There's only 1 button because the table only has 1 row
                expect(button.isPresent()).toBe(false);
                // The test for whether it links to the correct url is tested in Recordset app tests.
            });

            it('should not display the delete button', function() {
                var button = recordsetPage.getDeleteActionButtons().first();
                // There's only 1 button because the table only has 1 row
                expect(button.isPresent()).toBe(false);
                // The test for whether it links to the correct url is tested in Recordset app tests.
            });
        });
    });

    describe('for a table that allows edit and create (but no delete)', function() {
        beforeAll(function() {
            chaisePage.refresh(url + ':main_update_table/' + testParams.key.columnName + testParams.key.operator + testParams.key.value);
            chaisePage.recordsetPageReady();
        });

        it('should display the add record [+] button', function() {
            chaisePage.waitForElementInverse(element(by.id("spinner")));
            var button = recordsetPage.getAddRecordLink();
            expect(button.isDisplayed()).toBe(true);
        });

        it('should display the Edit link', function() {
            var link = recordsetPage.getEditRecordLink();
            expect(link.isDisplayed()).toBe(true);
        });

        describe('the action column', function() {
            it("should display 'Actions' as the column header", function() {
                expect(element.all(by.tagName('th')).get(0).getText()).toBe("Actions");
            });

            it('should display the view button', function() {
                var button = recordsetPage.getViewActionButtons().first();
                // There's only 1 button because the table only has 1 row
                expect(button.isDisplayed()).toBe(true);
                // The test for whether it links to the correct url is tested in Recordset app tests.
            });

            it('should display the edit button', function() {
                var button = recordsetPage.getEditActionButtons().first();
                // There's only 1 button because the table only has 1 row
                expect(button.isDisplayed()).toBe(true);
                // The test for whether it links to the correct url is tested in Recordset app tests.
            });

            it('should not display the delete button', function() {
                var button = recordsetPage.getDeleteActionButtons().first();
                // There's only 1 button because the table only has 1 row
                expect(button.isPresent()).toBe(false);
                // The test for whether it links to the correct url is tested in Recordset app tests.
            });
        });
    });

    describe('for a delete-only table', function() {
        beforeAll(function() {
            chaisePage.refresh(url + ':main_delete_table/' + testParams.key.columnName + testParams.key.operator + testParams.key.value);
            chaisePage.recordsetPageReady();
        });

        it('should not display the add record [+] button', function() {
            var button = recordsetPage.getAddRecordLink();
            expect(button.isPresent()).toBe(false);
        });

        it('should not display the Edit link', function() {
            var link = recordsetPage.getEditRecordLink();
            expect(link.isPresent()).toBe(false);
        });

        describe('the action column', function() {
            it("should display 'Actions' as the column header", function() {
                expect(element.all(by.tagName('th')).get(0).getText()).toBe("Actions");
            });

            it('should display the view button', function() {
                chaisePage.waitForElementInverse(element(by.id("spinner")));
                var button = recordsetPage.getViewActionButtons().first();
                // There's only 1 button because the table only has 1 row
                expect(button.isDisplayed()).toBe(true);
                // The test for whether it links to the correct url is tested in Recordset app tests.
            });

            it('should not display the edit button', function() {
                var button = recordsetPage.getEditActionButtons().first();
                // There's only 1 button because the table only has 1 row
                expect(button.isPresent()).toBe(false);
                // The test for whether it links to the correct url is tested in Recordset app tests.
            });

            it('should display the delete button', function() {
                var button = recordsetPage.getDeleteActionButtons().first();
                // There's only 1 button because the table only has 1 row
                expect(button.isDisplayed()).toBe(true);
                // The test for whether it links to the correct url is tested in Recordset app tests.
            });
        });
    });
});
