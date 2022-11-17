// The goal of this spec is to test whether RecordEdit app correctly displays the right UI controls based on annotation
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

    it('for a create-only table, the app should not load the form and displays error modal instead', function() {
        url = baseUrl + ':main_create_table/' + testParams.key.columnName + testParams.key.operator + testParams.key.value;
        modalBody = element(by.css('.modal-body'));

        browser.get(url);
        chaisePage.waitForElement(modalBody).then(function() {
            expect(modalBody.isDisplayed()).toBe(true);
        });
    });

    it('for a read-only table, the app should not load the form and displays error modal instead', function() {
        url = baseUrl + ':main_read_table/' + testParams.key.columnName + testParams.key.operator + testParams.key.value;
        modalBody = element(by.css('.modal-body'));

        browser.get(url);
        chaisePage.waitForElement(modalBody).then(function() {
            expect(modalBody.isDisplayed()).toBe(true);
        });
    });

    it('for a delete-only table, the app should not load the form and displays error modal instead', function() {
        url = baseUrl + ':main_delete_table/' + testParams.key.columnName + testParams.key.operator + testParams.key.value;
        modalBody = element(by.css('.modal-body'));

        browser.get(url);
        chaisePage.waitForElement(modalBody).then(function() {
            expect(modalBody.isDisplayed()).toBe(true);
        });
    });

    describe('for a table that allows create and edit, ', function() {
        beforeAll(function() {
            browser.get(baseUrl + ':main_update_table/' + testParams.key.columnName + testParams.key.operator + testParams.key.value);
            chaisePage.waitForElement(element(by.id('page-title'))).then(function() {
                expect(element(by.id('page-title')).isDisplayed()).toBe(true);
            });
        });

        describe('the FK search popup modal should have the select button in the action column and', function() {
            var rows;
            afterEach(function() {
                // The select button in the action column should be displayed
                rows = chaisePage.recordsetPage.getRows();
                var selectBtn = rows.get(0).all(by.css('.select-action-button')).first();
                expect(selectBtn.isDisplayed()).toBe(true);
                selectBtn.click();
            });

            it('should show the create button in the modal for a FK-related table that allows creation', function() {
                var input = recordEditPage.getForeignKeyInputs().first();
                var modalTitle = recordEditPage.getModalTitle();
                chaisePage.clickButton(input).then(function () {
                    return chaisePage.waitForElement(modalTitle);
                }).then(function() {
                    chaisePage.waitForElementInverse(element.all(by.id("spinner")).get(0));
                    var addBtn = chaisePage.recordsetPage.getAddRecordLink(element(by.css('.modal-body')));
                    expect(addBtn.isDisplayed()).toBe(true);
                });
            });

            it('should not show the create button in the modal for a read-only table', function() {
                // index is 2 because of show all
                var input = recordEditPage.getForeignKeyInputs().get(2);
                var modalTitle = recordEditPage.getModalTitle();
                input.click();
                chaisePage.waitForElement(modalTitle).then(function() {
                    chaisePage.waitForElementInverse(element.all(by.id("spinner")).get(0));
                    var addBtn = chaisePage.recordsetPage.getAddRecordLink(element(by.css('.modal-body')));
                    expect(addBtn.isPresent()).toBe(false);
                });
            });

            it('should show the create button in the modal for a table that allows update and create', function() {
                // index is 4 because of show all
                var input = recordEditPage.getForeignKeyInputs().get(4);
                var modalTitle = recordEditPage.getModalTitle();
                input.click();
                chaisePage.waitForElement(modalTitle).then(function() {
                    chaisePage.waitForElementInverse(element.all(by.id("spinner")).get(0));
                    var addBtn = chaisePage.recordsetPage.getAddRecordLink(element(by.css('.modal-body')));
                    expect(addBtn.isDisplayed()).toBe(true);
                });
            });

            it('should not show the create button in the modal for a table that only allows delete', function() {
                // index is 6 because of show all
                var input = recordEditPage.getForeignKeyInputs().get(6);
                var modalTitle = recordEditPage.getModalTitle();
                input.click();
                chaisePage.waitForElement(modalTitle).then(function() {
                    chaisePage.waitForElementInverse(element.all(by.id("spinner")).get(0));
                    var addBtn = chaisePage.recordsetPage.getAddRecordLink(element(by.css('.modal-body')));
                    expect(addBtn.isPresent()).toBe(false);
                });
            });
        });
    });

});
