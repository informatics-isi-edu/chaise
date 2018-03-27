var chaisePage = require('../../../utils/chaise.page.js');
var recordEditHelpers = require('../../../utils/recordedit-helpers.js');
var EC = protractor.ExpectedConditions;

var testParams = {
    schema_name: "faceting",
    table_name: "main",
    filter_secondary_key: {
        facetIdx: 14,
        option: 0,
        modalOption: 1,
        totalNumOptions: 10,
        numRows: 10,
        numRowsAfterModal: 20

    },
    not_null: {
        option: 0,
        result_num_w_not_null: 20,
        modal_available_options: 20,
        disabled_rows_w_not_null: 9,
        options_w_not_null: [
            'All Records With Value', '1', '2', '3', '4', '5', '6', '7', '8', '9'
        ],
        options_wo_not_null: [
            '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'
        ]
    },
    customFilter: {
        ermrestFilter: "id=1;id=2;int_col::geq::20",
        numRows: 7,
        numRowsWFacet: 1,
        numRowsWOFilter: 1,
        facet: 0,
        totalNumOptions: 7,
        options: ["1", "2", "6", "7", "8", "9", "10"],
        optionsWOFilter: ["2", "1", "3", "4", "5", "6", "7", "8", "9", "10"],
        option: 1
    },
    recordColumns: [ "text_col", "longtext_col", "markdown_col", "int_col", "float_col", "date_col", "timestamp_col", "boolean_col", "jsonb_col", "eqK7CNP-yhTDab74BW-7lQ", "cD8qWek-pEc_of8BUq0kAw" ],
    recordValues: {
        text_col: "one",
        longtext_col: "one",
        markdown_col: "one",
        int_col: "11",
        float_col: "11.1100",
        date_col: "2001-01-01",
        timestamp_col: "2001-01-01 00:01:01",
        boolean_col: "true",
        jsonb_col: JSON.stringify({"key":"one"},undefined,2),
        "eqK7CNP-yhTDab74BW-7lQ": "one", // faceting_main_fk1
        "cD8qWek-pEc_of8BUq0kAw": "one" // faceting_main_fk2
    }
};


describe("Other facet features, ", function() {

    describe("selecting entity facet that is not on the shortest key.", function () {
        var facet, idx, clearAll;
        beforeAll(function (done) {
            var uri = browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schema_name + ":" + testParams.table_name;

            browser.ignoreSynchronization=true;
            browser.get(uri);
            chaisePage.waitForElementInverse(element.all(by.id("spinner")).first());

            clearAll = chaisePage.recordsetPage.getClearAllFilters();

            idx = testParams.filter_secondary_key.facetIdx;
            facet = chaisePage.recordsetPage.getFacetById(idx);

            done();
        });

        it ("should open the facet, select a value to filter on.", function (done) {
            chaisePage.clickButton(clearAll).then(function () {
                return chaisePage.waitForElementInverse(element.all(by.id("spinner")).first());
            }).then(function () {
              return chaisePage.clickButton(facet);
            }).then(function () {
                // wait for facet to open
                browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getFacetCollapse(idx)), browser.params.defaultTimeout);

                // wait for facet checkboxes to load
                browser.wait(function () {
                    return chaisePage.recordsetPage.getFacetOptions(idx).count().then(function(ct) {
                        return ct == testParams.filter_secondary_key.totalNumOptions;
                    });
                }, browser.params.defaultTimeout);

                // wait for list to be fully visible
                browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getList(idx)), browser.params.defaultTimeout);

                return chaisePage.clickButton(chaisePage.recordsetPage.getFacetOption(idx, testParams.filter_secondary_key.option));
            }).then(function () {
                // wait for request to return
                browser.wait(EC.visibilityOf(clearAll), browser.params.defaultTimeout);

                chaisePage.waitForElementInverse(element.all(by.id("spinner")).first());

                return chaisePage.recordsetPage.getRows().count();
            }).then(function (ct) {
                expect(ct).toBe(testParams.filter_secondary_key.numRows, "number of rows is incorrect");
                done();
            }).catch(function (err) {
                console.log(err);
                done.fail();
            });

        });

        it ("the selected value should be selected on the modal.", function (done) {
            var showMore = chaisePage.recordsetPage.getShowMore(idx);
            browser.wait(EC.elementToBeClickable(showMore));
            chaisePage.clickButton(showMore).then(function () {
                chaisePage.waitForElementInverse(element.all(by.id("spinner")).first());

                expect(chaisePage.recordsetPage.getCheckedModalOptions().count()).toBe(1, "number of checked rows missmatch.");
                return chaisePage.recordsetPage.getModalOptions();
            }).then(function (options) {
                expect(options[testParams.filter_secondary_key.option+1].isSelected()).toBeTruthy("the correct option was not selected.");
                done();
            }).catch(function (err) {
                console.log(err);
                done.fail();
            });
        });

        it ("selecting new values on the modal and submitting them, should change the filters on submit.", function (done) {
            chaisePage.recordsetPage.getModalOptions().then(function (options) {
                return chaisePage.clickButton(options[testParams.filter_secondary_key.modalOption+1]);
            }).then(function () {
                return chaisePage.clickButton(chaisePage.recordsetPage.getModalSubmit());
            }).then(function () {
                chaisePage.waitForElementInverse(element.all(by.id("spinner")).first());

                return chaisePage.recordsetPage.getCheckedFacetOptions(idx).count();
            }).then (function (cnt) {
                expect(cnt).toBe(2, "Number of facet options is incorrect after returning from modal");

                return chaisePage.recordsetPage.getRows().count();
            }).then(function (ct) {
                expect(ct).toBe(testParams.filter_secondary_key.numRowsAfterModal, "Number of visible rows after selecting a second option from the modal is incorrect");
                return chaisePage.clickButton(chaisePage.recordsetPage.getClearAllFilters());
            }).then(function () {
                done();
            }).catch(function (err) {
                console.log(err);
                done.fail();
            });
        });

    });

    describe("Records With Value (not-null) filter, ", function () {
        var notNullBtn, showMore;

        beforeAll(function () {
            var uri = browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schema_name + ":" + testParams.table_name;

            browser.ignoreSynchronization=true;
            browser.get(uri);
            chaisePage.waitForElementInverse(element(by.id("spinner")));

            clearAll = chaisePage.recordsetPage.getClearAllFilters();
            showMore = chaisePage.recordsetPage.getShowMore(testParams.not_null.option);
        });

        it ("`All Records With Value` option must be available in modal picker.", function (done) {
            browser.wait(EC.elementToBeClickable(showMore));
            chaisePage.clickButton(showMore).then(function () {
                chaisePage.waitForElementInverse(element(by.id("spinner")));
                notNullBtn = chaisePage.recordsetPage.getModalMatchNotNullInput();
                expect(notNullBtn.isPresent()).toEqual(true);
                done();
            }).catch(function (err) {
                console.log(err);
                done.fail();
            });

        });

        it ("Selecting `All Records With Value` should disable all the rows.", function (done) {
            chaisePage.clickButton(notNullBtn).then(function () {
                browser.wait(function () {
                    return chaisePage.recordsetPage.getModalDisabledRows().count().then(function (ct) {
                        return (ct > 0);
                    });
                });
                expect(chaisePage.recordsetPage.getModalDisabledRows().count()).toBe(testParams.not_null.modal_available_options, "number of disabled rows missmatch.");
                expect(chaisePage.recordsetPage.getCheckedModalOptions().count()).toBe(0, "number of checked rows missmatch.");
                return chaisePage.clickButton(chaisePage.recordsetPage.getModalSubmit());
            }).then(function () {
                done();
            }).catch(function (err) {
                console.log(err);
                done.fail();
            });
        });

        it ("After submitting the filters, `All Records With Value` should be on top of the list with the rest of options being disabled", function (done) {
            chaisePage.waitForElementInverse(chaisePage.recordsetPage.getFacetSpinner(testParams.not_null.option));
            browser.wait(function () {
                return chaisePage.recordsetPage.getCheckedFacetOptions(testParams.not_null.option).count().then(function(ct) {
                    return ct == 1;
                });
            }, browser.params.defaultTimeout);

            chaisePage.recordsetPage.getCheckedFacetOptions(testParams.not_null.option).count().then(function (count) {
                expect(count).toBe(1, "number of selected filters missmatch.");

                return chaisePage.recordsetPage.getFacetOptionsText(testParams.not_null.option);
            }).then(function (text) {
                expect(text).toEqual(testParams.not_null.options_w_not_null, "the text of selected faacet missmatch.");
                expect(chaisePage.recordsetPage.getDisabledFacetOptions(testParams.not_null.option).count()).toBe(testParams.not_null.disabled_rows_w_not_null, "numer of disabled filters missmatch.");
                expect(chaisePage.recordsetPage.getRows().count()).toBe(testParams.not_null.result_num_w_not_null, "number of results missmatch.");

                done();
            }).catch(function (err) {
                console.log(err);
                done.fail();
            });
        });

        it ("Deselecting `All Records With Value` should enable all the values on the list.", function (done) {
            chaisePage.clickButton(chaisePage.recordsetPage.getFacetOption(testParams.not_null.option, 0)).then(function () {
                return chaisePage.recordsetPage.getFacetOptionsText(testParams.not_null.option);
            }).then(function (text) {
                // make sure the options havn't changed
                expect(text).toEqual(testParams.not_null.options_w_not_null, "the text of selected faacet missmatch.");

                expect(chaisePage.recordsetPage.getCheckedFacetOptions(testParams.not_null.option).count()).toBe(0, "number of selected filters missmatch.");
                expect(chaisePage.recordsetPage.getDisabledFacetOptions(testParams.not_null.option).count()).toBe(0, "numer of disabled filters missmatch.");

                done();
            }).catch(function (err) {
                console.log(err);
                done.fail();
            });
        });

        it ("should be able to select other filters on the facet.", function (done) {
            chaisePage.clickButton(chaisePage.recordsetPage.getFacetOption(testParams.not_null.option, 1)).then(function () {
                return chaisePage.recordsetPage.getFacetOptionsText(testParams.not_null.option);
            }).then(function (text) {
                // make sure the options havn't changed
                expect(text).toEqual(testParams.not_null.options_w_not_null, "the text of selected faacet missmatch.");

                expect(chaisePage.recordsetPage.getCheckedFacetOptions(testParams.not_null.option).count()).toBe(1, "Number of selected filters missmatch.");
                expect(chaisePage.recordsetPage.getDisabledFacetOptions(testParams.not_null.option).count()).toBe(0, "numer of disabled filters missmatch.");

                done();
            }).catch(function (err) {
                console.log(err);
                done.fail();
            });
        });

        it ("Selecting `All Records With Value` in the list, should remove all the checked filters on facet.", function (done) {
            chaisePage.clickButton(chaisePage.recordsetPage.getFacetOption(testParams.not_null.option, 0)).then(function () {
                return chaisePage.recordsetPage.getFacetOptionsText(testParams.not_null.option);
            }).then(function (text) {
                // make sure the options haven't changed
                expect(text).toEqual(testParams.not_null.options_w_not_null, "the text of selected faacet missmatch.");

                expect(chaisePage.recordsetPage.getCheckedFacetOptions(testParams.not_null.option).count()).toBe(1, "number of selected filters missmatch.");
                expect(chaisePage.recordsetPage.getDisabledFacetOptions(testParams.not_null.option).count()).toBe(testParams.not_null.disabled_rows_w_not_null, "numer of disabled filters missmatch.");

                done();
            }).catch(function (err) {
                console.log(err);
                done.fail();
            });
        });

        it ("going to modal picker with `All Records With Value`, the checkmark for `All Records With Value` must be checked.", function (done) {
            browser.wait(EC.elementToBeClickable(showMore));
            showMore.click().then(function () {
                chaisePage.waitForElementInverse(element(by.id("spinner")));
                notNullBtn = chaisePage.recordsetPage.getModalMatchNotNullInput();
                expect(notNullBtn.isPresent()).toBeTruthy("not-null is not present");
                expect(notNullBtn.isSelected()).toBeTruthy("not-null not checked.");
                expect(chaisePage.recordsetPage.getModalDisabledRows().count()).toBe(testParams.not_null.modal_available_options, "number of disabled rows missmatch.");
                expect(chaisePage.recordsetPage.getCheckedModalOptions().count()).toBe(0, "number of checked rows missmatch.");

                // NOTE after this test case the modal is still open, the next test cases should just start a new url.
                done();
            }).catch(function (err) {
                console.log(err);
                done.fail();
            });
        });
    });

    describe("navigating to recordset with filters that faceting doesn't support.", function () {
        var customFilterParams = testParams.customFilter;
        var idx = customFilterParams.facet;

        beforeAll(function () {
            var uri = browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schema_name + ":" + testParams.table_name;

            uri += "/" + customFilterParams.ermrestFilter;

            browser.ignoreSynchronization=true;
            browser.get(uri);
            chaisePage.waitForElementInverse(element(by.id("spinner")));
        });

        it ("should show the applied filter and clear all button.", function (done) {
            chaisePage.recordsetPage.getFilters().then(function (filters) {
                expect(filters.length).toEqual(1, "filter is missing");

                expect(filters[0].getText()).toEqual("Custom Filter: " + customFilterParams.ermrestFilter, "filter text missmatch.");

                expect(chaisePage.recordsetPage.getClearAllFilters().isDisplayed()).toBeTruthy("`Clear All` is not visible");

                done();
            }).catch(function (err) {
                console.log(err);
                done.fail();
            });
        });

        it ("main and faceting data should be based on the filter, and be able to apply new filters.", function (done) {
            // main
            expect(chaisePage.recordsetPage.getRows().count()).toEqual(customFilterParams.numRows, "total row count missmatch.");

            chaisePage.recordsetPage.getFacetById(idx).click().then(function () {
                browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getFacetCollapse(idx)), browser.params.defaultTimeout);

                // wait for facet checkboxes to load
                browser.wait(function () {
                    return chaisePage.recordsetPage.getFacetOptions(idx).count().then(function(ct) {
                        return ct == customFilterParams.totalNumOptions;
                    });
                }, browser.params.defaultTimeout);

                // wait for list to be fully visible
                browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getList(idx)), browser.params.defaultTimeout);

                return chaisePage.recordsetPage.getFacetOptionsText(idx);
            }).then(function (text) {
                expect(text).toEqual(customFilterParams.options, "options missmatch.");

                // select a new facet
                return chaisePage.clickButton(chaisePage.recordsetPage.getFacetOption(idx, customFilterParams.option));
            }).then(function () {
                chaisePage.waitForElementInverse(element(by.id("spinner")));

                // make sure filter is there
                expect(chaisePage.recordsetPage.getFilters().count()).toBe(2, "facet filter missing.");

                // make sure data has been updated
                expect(chaisePage.recordsetPage.getRows().count()).toBe(customFilterParams.numRowsWFacet, "");

                done();
            }).catch(function (err) {
                console.log(err);
                done.fail();
            });
        });

        it ("clicking on `x` for Custom Filter should only clear the filter.", function (done) {
            expect(chaisePage.recordsetPage.getClearCustomFilters().isDisplayed()).toBeTruthy("`Clear Custom Filters` is not visible.");

            chaisePage.recordsetPage.getClearCustomFilters().click().then(function () {
                chaisePage.waitForElementInverse(element(by.id("spinner")));

                expect(chaisePage.recordsetPage.getRows().count()).toEqual(customFilterParams.numRowsWOFilter, "total row count missmatch.");

                expect(chaisePage.recordsetPage.getFacetOptionsText(idx)).toEqual(customFilterParams.optionsWOFilter, "options missmatch.");

                done();
            }).catch(function (err) {
                console.log(err);
                done.fail();
            });
        });
    });

    describe("navigating to record and recordedit app with facets.", function() {

        var uri = browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schema_name + ":" + testParams.table_name;
        var clearAll;

        beforeEach(function () {
            browser.ignoreSynchronization=true;
            browser.get(uri);
            chaisePage.waitForElementInverse(element(by.id("spinner")));

            clearAll = chaisePage.recordsetPage.getClearAllFilters();
        });

        it("clicking edit should show the same number of forms as rows.", function () {
            browser.wait(EC.elementToBeClickable(clearAll));
            clearAll.click().then(function () {
                return chaisePage.waitForElementInverse(element(by.id("spinner")));
            }).then(function () {
                return chaisePage.recordsetPage.getEditRecordLink().click();
            }).then(function() {
                browser.wait(function() {
                    return chaisePage.recordEditPage.getForms().count().then(function(ct) {
                        return (ct == 25);
                    });
                }, browser.params.defaultTimeout);

                return chaisePage.recordEditPage.getForms().count();
            }).then(function(count) {
                expect(count).toBe(25);
            }).catch(function (err) {
                console.log(err);
            });
        });

        it("navigating to record with a facet url", function () {
            browser.getCurrentUrl().then(function (url) {
                var uri = url.replace("recordset", "record");
                browser.get(uri);

                chaisePage.waitForElement(element(by.id('tblRecord')));
                recordEditHelpers.testRecordAppValuesAfterSubmission(testParams.recordColumns, testParams.recordValues);
            });
        });
    });
});
