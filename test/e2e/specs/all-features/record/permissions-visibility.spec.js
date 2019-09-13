// The goal of this spec is to test whether Record app correctly displays the right UI controls given different user permission levels
var chaisePage = require('../../../utils/chaise.page.js');
var recordPage = chaisePage.recordPage;
var testParams = {
    key: {
        columnName: "id",
        value: 1,
        operator: "="
    }
};


describe('When viewing Record app', function() {
    var EC = protractor.ExpectedConditions;
    beforeAll(function() {
        browser.ignoreSynchronization = true;
    });

    describe('as a read-only user', function() {
        beforeAll(function() {
            browser.get(browser.params.url + "/record/#" + browser.params.catalogId + "/multi-permissions:main_read_table/" + testParams.key.columnName + testParams.key.operator + testParams.key.value);
            var title = chaisePage.recordPage.getEntityTitleElement();
            chaisePage.waitForElement(title).then(function() {
                expect(title.isDisplayed()).toBeTruthy();
            });
        });

        it('should display the share button', function() {
            var permalink = recordPage.getShareButton();
            expect(permalink.isDisplayed()).toBeTruthy();
        });

        it('should not display the Create button', function() {
            var button = recordPage.getCreateRecordButton();
            expect(button.isPresent()).toBeFalsy();
        });

        it('should not display the Edit button', function() {
            var button = recordPage.getEditRecordButton();
            expect(button.isPresent()).toBeFalsy();
        });

        it('should not display the Copy button', function() {
            var button = recordPage.getCopyRecordButton();
            expect(button.isPresent()).toBeFalsy();
        });

        it('should not display the Delete button', function() {
            var button = recordPage.getDeleteRecordButton();
            expect(button.isPresent()).toBeFalsy();
        });

        it('should display the related tables toggle as "Show empty sections"', function() {
            var button = recordPage.getShowAllRelatedEntitiesButton();
            expect(button.isDisplayed()).toBeTruthy();
            expect(button.getText()).toBe("Show empty sections");
        });
    });

    describe('as a create-only user', function() {
        beforeAll(function() {
            browser.get(browser.params.url + "/record/#" + browser.params.catalogId + "/multi-permissions:main_create_table/" + testParams.key.columnName + testParams.key.operator + testParams.key.value);
            var title = chaisePage.recordPage.getEntityTitleElement();
            chaisePage.waitForElement(title).then(function() {
                expect(title.isDisplayed()).toBeTruthy();
            });
        });

        it('should display the share button', function() {
            var permalink = recordPage.getShareButton();
            expect(permalink.isDisplayed()).toBeTruthy();
        });

        it('should display the Create button', function() {
            var button = recordPage.getCreateRecordButton();
            expect(button.isDisplayed()).toBeTruthy();
        });

        it('should display the Edit button as disabled', function() {
            var button = recordPage.getEditRecordButton();
            expect(button.isPresent()).toBeTruthy();
            expect(button.getAttribute("disabled")).toBeTruthy();
        });

        it('should display the Copy button as disabled', function() {
            var button = recordPage.getCopyRecordButton();
            expect(button.isPresent()).toBeTruthy();
            expect(button.getAttribute("disabled")).toBeTruthy();
        });

        it('should display the Delete button as disabled', function() {
            var button = recordPage.getDeleteRecordButton();
            expect(button.isPresent()).toBeTruthy();
            expect(button.getAttribute("disabled")).toBeTruthy();
        });

        // As create only user, 'Hide Empty Related Tables' should appear because the user can create entities for one or more related tables
        it('should display the related tables toggle as "Hide empty sections"', function() {
            var button = recordPage.getShowAllRelatedEntitiesButton();
            expect(button.isDisplayed()).toBeTruthy();
            expect(button.getText()).toBe("Hide empty sections");
        });

        describe('the related tables', function() {
            it('should show the "Explore" link', function() {
                var link = recordPage.getMoreResultsLink('in_create_table');
                expect(link.isDisplayed()).toBeTruthy();
                expect(link.getText()).toBe('Explore');
            });

            it('should show an "Add record" link if the table is an inbound relationship', function() {
                var link = recordPage.getAddRecordLink('in_create_table');
                expect(link.isDisplayed()).toBeTruthy();
                expect(link.getText()).toBe('Add record');
            });

            it('should show an "Add record" link if the table is an associative relationship', function() {
                // If a related table is an association table, it should show "Unlink"
                var link = recordPage.getAddRecordLink('assoc_create_table');
                expect(link.isDisplayed()).toBeTruthy();
                expect(link.getText()).toBe('Add record');
            });

            it('should not show an "Add record" or "Unlink" link if the table doesn\'t allow adding a new row', function() {
                var link = recordPage.getAddRecordLink('in_delete_table');
                expect(link.isPresent()).toBeFalsy();
            });

            it('should show a "Table Display" toggle link if the table has a row_markdown_pattern', function() {
                var link = recordPage.getToggleDisplayLink('in_read_table');
                expect(link.isDisplayed()).toBeTruthy();
                expect(link.getText()).toBe('Table mode');
                // Actual toggling behavior (like does it show the right table format and whether the toggle text flips correctly is tested in Record presentation spec)
            });

            it('should not show a toggle display link if the table does not have a row_markdown_pattern', function() {
                var link = recordPage.getToggleDisplayLink('in_create_table');
                expect(link.isPresent()).toBeFalsy();
            });
        });
    });

    describe('as a user who can update (and create)', function() {
        beforeAll(function() {
            browser.get(browser.params.url + "/record/#" + browser.params.catalogId + "/multi-permissions:main_update_table/" + testParams.key.columnName + testParams.key.operator + testParams.key.value);
            var title = chaisePage.recordPage.getEntityTitleElement();
            chaisePage.waitForElement(title).then(function() {
                expect(title.isDisplayed()).toBeTruthy();
            });
        });

        it('should display the share button', function() {
            var permalink = recordPage.getShareButton();
            expect(permalink.isDisplayed()).toBeTruthy();
        });

        it('should display the Create button', function() {
            // Create button is displayed despite the fact that we're modeling a
            // user with "edit-only" permissions because, as of this writing, if
            // a user can edit, the user can also create.
            var button = recordPage.getCreateRecordButton();
            expect(button.isDisplayed()).toBeTruthy();
        });

        it('should display the Edit button', function() {
            var button = recordPage.getEditRecordButton();
            expect(button.isDisplayed()).toBeTruthy();
        });

        it('should display the Copy button', function() {
            var button = recordPage.getCopyRecordButton();
            expect(button.isDisplayed()).toBeTruthy();
        });

        it('should display the Delete button as disabled', function() {
            var button = recordPage.getDeleteRecordButton();
            expect(button.isPresent()).toBeTruthy();
            expect(button.getAttribute("disabled")).toBeTruthy();
        });

        it('should display the related tables toggle as "Hide empty sections"', function() {
            var button = recordPage.getShowAllRelatedEntitiesButton();
            expect(button.isDisplayed()).toBeTruthy();
            expect(button.getText()).toBe("Hide empty sections");
            // Actual toggling behavior (like does it show the right table format and whether the toggle text flips correctly is tested in Record presentation spec)
        });

        it('should show an "Edit mode" toggle link if a related table has a row_markdown_pattern', function() {
            // The link is only "Edit" if user can edit; otherwise it should say "Table Display"
            var link = recordPage.getToggleDisplayLink('in_update_table');
            expect(link.isDisplayed()).toBeTruthy();
            expect(link.getText()).toBe('Edit mode');
            // Actual toggling behavior (like does it show the right table format and whether the toggle text flips correctly is tested in Record presentation spec)
        });
    });

    describe('as a delete-only user', function() {
        beforeAll(function() {
            browser.get(browser.params.url + "/record/#" + browser.params.catalogId + "/multi-permissions:main_delete_table/" + testParams.key.columnName + testParams.key.operator + testParams.key.value);
            var title = chaisePage.recordPage.getEntityTitleElement();
            chaisePage.waitForElement(title).then(function() {
                expect(title.isDisplayed()).toBeTruthy();
            });
        });

        it('should display the share button', function() {
            var permalink = recordPage.getShareButton();
            expect(permalink.isDisplayed()).toBeTruthy();
        });

        it('should display the Create button as disabled', function() {
            var button = recordPage.getCreateRecordButton();
            expect(button.isPresent()).toBeTruthy();
            expect(button.getAttribute("disabled")).toBeTruthy();
        });

        it('should display the Edit button as disabled', function() {
            var button = recordPage.getEditRecordButton();
            expect(button.isPresent()).toBeTruthy();
            expect(button.getAttribute("disabled")).toBeTruthy();
        });

        it('should display the Copy button as disabled', function() {
            var button = recordPage.getCopyRecordButton();
            expect(button.isPresent()).toBeTruthy();
            expect(button.getAttribute("disabled")).toBeTruthy();
        });

        it('should display the Delete button', function() {
            var button = recordPage.getDeleteRecordButton();
            expect(button.isDisplayed()).toBeTruthy();
        });

        it('should display the related tables toggle as "Show empty sections"', function() {
            var button = recordPage.getShowAllRelatedEntitiesButton();
            expect(button.isDisplayed()).toBeTruthy();
            expect(button.getText()).toBe("Show empty sections");
            // Actual toggling behavior (like does it show the right table format and whether the toggle text flips correctly is tested in Record presentation spec)
        });
    });
});
