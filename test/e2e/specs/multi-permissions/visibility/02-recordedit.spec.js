// The goal of this spec is to test whether RecordEdit app correctly displays the right UI controls given different user permission levels
var testConfiguration = browser.params.configuration;
var testParams = testConfiguration.tests.params;
var chaisePage = require('../../../utils/chaise.page.js');
var recordEditPage = chaisePage.recordEditPage;


describe('When viewing RecordEdit app', function() {
    var EC = protractor.ExpectedConditions, url;
    beforeAll(function() {
        url = browser.params.url.replace('/record', '/recordedit');
    });

    describe('as a user who can update', function() {
        beforeAll(function() {
            browser.get(url + ':main_update_table/' + testParams.key.columnName + testParams.key.operator + testParams.key.value);
            chaisePage.waitForElement(element(by.id('entity-title'))).then(function() {
                expect(element(by.id('entity-title')).isDisplayed()).toBe(true);
            });
        });

        it('should not display the delete button', function() {
            var button = recordEditPage.getDeleteRecordButton();
            expect(button.isPresent()).toBe(false);
        });

        describe('the foreign key search popup modal should have the select button the action column button and', function() {
            var rows;
            afterEach(function() {
                // The select button in the action column should be displayed
                rows = chaisePage.recordsetPage.getRows();
                var selectBtn = rows.get(0).all(by.css('.select-action-button')).first();
                expect(selectBtn.isDisplayed()).toBe(true);
                selectBtn.click();
            });

            it('should show the add [+] button in the modal for a FK-related table that allows creation', function() {
                var input = recordEditPage.getForeignKeyInputs().first();
                var modalTitle = recordEditPage.getModalTitle();
                input.click();
                chaisePage.waitForElement(modalTitle).then(function() {
                    var addBtn = chaisePage.recordsetPage.getAddRecordButton();
                    expect(addBtn.isDisplayed()).toBe(true);
                });
            });

            it('should not show the add [+] button in the modal for a FK-related table that only allows read access', function() {
                var input = recordEditPage.getForeignKeyInputs().get(1);
                var modalTitle = recordEditPage.getModalTitle();
                input.click();
                chaisePage.waitForElement(modalTitle).then(function() {
                    var addBtn = chaisePage.recordsetPage.getAddRecordButton();
                    expect(addBtn.isPresent()).toBe(false);
                });
            });

            it('should show the add [+] button in the modal for a FK-related table that allows updating', function() {
                var input = recordEditPage.getForeignKeyInputs().get(2);
                var modalTitle = recordEditPage.getModalTitle();
                input.click();
                chaisePage.waitForElement(modalTitle).then(function() {
                    var addBtn = chaisePage.recordsetPage.getAddRecordButton();
                    expect(addBtn.isDisplayed()).toBe(true);
                });
            });

            it('should not show the add [+] button in the modal for a FK-related table that only allows delete access', function() {
                var input = recordEditPage.getForeignKeyInputs().get(3);
                var modalTitle = recordEditPage.getModalTitle();
                input.click();
                chaisePage.waitForElement(modalTitle).then(function() {
                    var addBtn = chaisePage.recordsetPage.getAddRecordButton();
                    expect(addBtn.isPresent()).toBe(false);
                });
            });
        });

    });

    describe('as a user who can delete', function() {
        beforeAll(function() {
            browser.get(url + ':main_delete_table/' + testParams.key.columnName + testParams.key.operator + testParams.key.value);
            chaisePage.waitForElement(element(by.id('entity-title'))).then(function() {
                expect(element(by.id('entity-title')).isDisplayed()).toBe(true);
            });
        });

        it('should display the delete button', function() {
            var button = recordEditPage.getDeleteRecordButton();
            expect(button.isDisplayed()).toBe(true);
        });
    });
});
