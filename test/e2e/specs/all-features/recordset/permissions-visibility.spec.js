// The goal of this spec is to test whether Recordset app correctly displays the right UI controls given different user permission levels
var chaisePage = require('../../../utils/chaise.page.js');
var recordsetPage = chaisePage.recordsetPage;
var testParams = {
    key: {
        columnName: "id",
        value: 1,
        operator: "="
    }
};

describe('When viewing Recordset app', function() {
    var EC = protractor.ExpectedConditions, url;
    beforeAll(function() {
        url = browser.params.url + "/recordset/#" + browser.params.catalogId + "/multi-permissions";
        browser.ignoreSynchronization = true;
    });

    describe('as a read-only user', function() {
        beforeAll(function() {
            browser.get(url + ':main_read_table/' + testParams.key.columnName + testParams.key.operator + testParams.key.value);
            chaisePage.waitForElement(element(by.id('page-title'))).then(function() {
                expect(element(by.id('page-title')).isDisplayed()).toBe(true);
            });
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

    describe('a user who can only create', function() {
        beforeAll(function() {
            browser.get(url + ':main_create_table/' + testParams.key.columnName + testParams.key.operator + testParams.key.value);
            chaisePage.waitForElement(element(by.id('page-title'))).then(function() {
                expect(element(by.id('page-title')).isDisplayed()).toBe(true);
            });
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

    describe('as a user who can update (and create)', function() {
        beforeAll(function() {
            browser.get(url + ':main_update_table/' + testParams.key.columnName + testParams.key.operator + testParams.key.value);
            chaisePage.waitForElement(element(by.id('page-title'))).then(function() {
                expect(element(by.id('page-title')).isDisplayed()).toBe(true);
            });
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

    describe('as a delete-only user', function() {
        beforeAll(function() {
            browser.get(url + ':main_delete_table/' + testParams.key.columnName + testParams.key.operator + testParams.key.value);
            chaisePage.waitForElement(element(by.id('page-title'))).then(function() {
                expect(element(by.id('page-title')).isDisplayed()).toBe(true);
            });
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
