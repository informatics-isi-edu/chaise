var chaisePage = require('../../../utils/chaise.page.js');
var recordEditHelpers = require('../../../utils/recordedit-helpers.js');
var testParams = {
    table_name: 'fkey-dropdown',
    schema_name: 'fk-display-mode',
    fk1_name: 'Y8Fm0o1t3FcHt0S8UjXs6A',
    fk2_name: 'jZz6GY0Bq-0EXpzflh6zZg',
    fk3_name: '-wCXD7GyYPDYVhTgm9in3A',
    column_names: ["wL-DqssB9s5GF9YvamJ-bg", "qkwBSF7Ifg0BOd8-5Lr0QA", "j9ojGrRsHfzL--N6T6DUIw"],
    column_values: {
        'wL-DqssB9s5GF9YvamJ-bg': 'two',
        'qkwBSF7Ifg0BOd8-5Lr0QA': 'five',
        'j9ojGrRsHfzL--N6T6DUIw': 'six'
    }
};

describe('Create a record,', () => {

    describe('For table ' + testParams.table_name + ',', () => {

        beforeAll(() => {
            chaisePage.navigate(browser.params.url + '/recordedit/#' + browser.params.catalogId + '/' + testParams.schema_name + ':' + testParams.table_name);

            chaisePage.waitForElement(element(by.id('submit-record-button')));
        });

        describe('Presentation for an entity with a foreign key dropdown input,', () => {

            it('should have 3 fkey dropdowns on the page', (done) => {
                chaisePage.recordEditPage.getFkeyDropdowns().count().then((ct) => {
                    expect(ct).toBe(3);

                    done();
                }).catch(chaisePage.catchTestError(done));
            });

            it('fk1 should have 25+ values', (done) => {
                const fk1 = chaisePage.recordEditPage.getDropdownElementByName(testParams.fk1_name);

                fk1.click().then(() => {
                    const dropdownOptions = chaisePage.recordEditPage.getDropdownSelectableOptions();

                    // make sure the number of dropdown options load
                    browser.wait(() => {
                        return dropdownOptions.count().then((ct) => {
                            return ct === 25;
                        });
                    });

                    expect(dropdownOptions.count()).toBe(25, 'total rows loaded in fk1 dropdown are incorrect')

                    done();
                }).catch(chaisePage.catchTestError(done));
            });

            it('clicking "... load more" should load 15 more options (40 total)', (done) => {
                chaisePage.recordEditPage.getDropdownLoadMoreRow().click().then(() => {
                    const dropdownOptions = chaisePage.recordEditPage.getDropdownSelectableOptions();

                    // make sure the number of dropdown options load
                    browser.wait(() => {
                        return dropdownOptions.count().then((ct) => {
                            return ct === 40;
                        });
                    });

                    expect(dropdownOptions.count()).toBe(40, 'total rows loaded in fk1 dropdown after loading more are incorrect')

                    done();
                }).catch(chaisePage.catchTestError(done));
            });

            it('adding a search term of twenty should limit the displayed set to 10', (done) => {
                chaisePage.recordEditPage.getDropdownSearch().sendKeys('twenty').then(() => {
                    const dropdownOptions = chaisePage.recordEditPage.getDropdownSelectableOptions();

                    browser.wait(() => {
                        return dropdownOptions.count().then((ct) => {
                            return ct === 10;
                        });
                    });

                    expect(dropdownOptions.count()).toBe(10, 'total rows loaded in fk1 dropdown after search are incorrect');

                    done();
                }).catch(chaisePage.catchTestError(done));
            });

            it('clearing the search term should show the first set of 25 rows again and select option 2', (done) => {
                chaisePage.recordEditPage.clearInput(chaisePage.recordEditPage.getDropdownSearch()).then(() => {
                    const dropdownOptions = chaisePage.recordEditPage.getDropdownSelectableOptions();

                    browser.wait(() => {
                        return dropdownOptions.count().then((ct) => {
                            return ct === 25;
                        });
                    });

                    expect(dropdownOptions.count()).toBe(25, 'total rows loaded in fk1 dropdown after clearing search are incorrect');
                    
                    // select option 2 (index 1) and close the dropdown
                    return dropdownOptions;
                }).then((options) => {
                    return chaisePage.clickButton(options[1]);
                }).then(() => {
                    done();
                }).catch(chaisePage.catchTestError(done));
            });

            it('fk2 should have 20 values and select option 5', (done) => {
                const fk2 = chaisePage.recordEditPage.getDropdownElementByName(testParams.fk2_name);

                fk2.click().then(() => {
                    const dropdownOptions = chaisePage.recordEditPage.getDropdownSelectableOptions();

                    // make sure the number of dropdown options load
                    browser.wait(() => {
                        return dropdownOptions.count().then((ct) => {
                            return ct === 20;
                        });
                    });

                    expect(dropdownOptions.count()).toBe(20, 'total rows loaded in fk2 dropdown are incorrect');

                    // select option 5 (index 4) and close the dropdown
                    return dropdownOptions;
                }).then((options) => {
                    return chaisePage.clickButton(options[4]);
                }).then(() => {
                    done();
                }).catch(chaisePage.catchTestError(done));
            });

            it('fk3 should have 20 values and select option 6', (done) => {
                const fk3 = chaisePage.recordEditPage.getDropdownElementByName(testParams.fk3_name);

                fk3.click().then(() => {
                    const dropdownOptions = chaisePage.recordEditPage.getDropdownSelectableOptions();

                    // make sure the number of dropdown options load
                    browser.wait(() => {
                        return dropdownOptions.count().then((ct) => {
                            return ct === 20;
                        });
                    });

                    expect(dropdownOptions.count()).toBe(20, 'total rows loaded in fk3 dropdown are incorrect');

                    // select option 6 (index 5) and close the dropdown
                    return dropdownOptions;
                }).then((options) => {
                    return chaisePage.clickButton(options[5]);
                }).then(() => {
                    done();
                }).catch(chaisePage.catchTestError(done));
            });

        });

        describe('Submit record', () => {
            beforeAll(() => {
                // Submit the form
                chaisePage.recordEditPage.submitForm();
            });

            var hasErrors = false;

            it('should have no errors, and should be redirected', () => {
                chaisePage.recordEditPage.getAlertError().then((err) => {
                    if (err) {
                        expect('Page has errors').toBe('No errors');
                        hasErrors = true;
                    } else {
                        expect(true).toBe(true);
                    }
                });
            });

            it('should be redirected to record page with correct values.', () => {
                if (!hasErrors) {
                    var redirectUrl = browser.params.url + '/record/#' + browser.params.catalogId + '/' + testParams.schema_name + ':' + testParams.table_name + '/RID=';

                    browser.wait(function () {
                        return browser.driver.getCurrentUrl().then(function (url) {
                            return url.startsWith(redirectUrl);
                        });
                    });

                    expect(browser.driver.getCurrentUrl()).toContain(redirectUrl);
                    recordEditHelpers.testRecordAppValuesAfterSubmission(testParams.column_names, testParams.column_values, testParams.column_names.length + 5); // +5 for system columns
                }
            });
        });

    });
});
