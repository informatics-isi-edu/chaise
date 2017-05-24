// The goal of this spec is to test whether RecordEdit app correctly displays the right UI controls given different user permission levels
var chaisePage = require('../../../utils/chaise.page.js');
var recordEditPage = chaisePage.recordEditPage;
var testParams = {
    key: {
        columnName: "id",
        value: 1,
        operator: "="
    }
};


describe('When viewing RecordEdit app', function() {
    var EC = protractor.ExpectedConditions, baseUrl, url, modalBody;
    beforeAll(function() {
        baseUrl = browser.params.url + "/recordedit/#" + browser.params.catalogId + "/multi-permissions";
        browser.ignoreSynchronization = true;
    });

    it('as a create-only user, the app should not load the form and displays error modal instead', function() {
        url = baseUrl + ':main_create_table/' + testParams.key.columnName + testParams.key.operator + testParams.key.value
        modalBody = element(by.css('.modal-body'));

        browser.get(url);
        chaisePage.waitForElement(modalBody).then(function() {
            expect(element(by.id('entity-title')).isPresent()).toBe(false);
            expect(modalBody.isDisplayed()).toBe(true);
        });
    });

    it('as a read-only user, the app should not load the form and displays error modal instead', function() {
        url = baseUrl + ':main_read_table/' + testParams.key.columnName + testParams.key.operator + testParams.key.value
        modalBody = element(by.css('.modal-body'));

        browser.get(url);
        chaisePage.waitForElement(modalBody).then(function() {
            expect(element(by.id('entity-title')).isPresent()).toBe(false);
            expect(modalBody.isDisplayed()).toBe(true);
        });
    });

    it('as a delete-only user, the app should not load the form and displays error modal instead', function() {
        url = baseUrl + ':main_delete_table/' + testParams.key.columnName + testParams.key.operator + testParams.key.value
        modalBody = element(by.css('.modal-body'));

        browser.get(url);
        chaisePage.waitForElement(modalBody).then(function() {
            expect(element(by.id('entity-title')).isPresent()).toBe(false);
            expect(modalBody.isDisplayed()).toBe(true);
        });
    });

    describe('as a user who can update (and create)', function() {
        beforeAll(function() {
            browser.get(baseUrl + ':main_update_table/' + testParams.key.columnName + testParams.key.operator + testParams.key.value);
            chaisePage.waitForElement(element(by.id('entity-title'))).then(function() {
                expect(element(by.id('entity-title')).isDisplayed()).toBe(true);
            });
        });

        it('should not display the delete button', function() {
            var button = recordEditPage.getDeleteRecordButton();
            expect(button.isPresent()).toBe(false);
            // The inverse of this case is tested in RecordEdit presentation spec.
        });

        describe('the FK search popup modal should have the select button in the action column button and', function() {
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

            it('should not show the add [+] button in the modal for a read-only table', function() {
                var input = recordEditPage.getForeignKeyInputs().get(1);
                var modalTitle = recordEditPage.getModalTitle();
                input.click();
                chaisePage.waitForElement(modalTitle).then(function() {
                    var addBtn = chaisePage.recordsetPage.getAddRecordButton();
                    expect(addBtn.isPresent()).toBe(false);
                });
            });

            it('should show the add [+] button in the modal for a table that allows update and create', function() {
                var input = recordEditPage.getForeignKeyInputs().get(2);
                var modalTitle = recordEditPage.getModalTitle();
                input.click();
                chaisePage.waitForElement(modalTitle).then(function() {
                    var addBtn = chaisePage.recordsetPage.getAddRecordButton();
                    expect(addBtn.isDisplayed()).toBe(true);
                });
            });

            it('should not show the add [+] button in the modal for a table that only allows delete', function() {
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
});
