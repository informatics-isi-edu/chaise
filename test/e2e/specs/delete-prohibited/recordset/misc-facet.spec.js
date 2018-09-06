var chaisePage = require('../../../utils/chaise.page.js');
var recordEditHelpers = require('../../../utils/recordedit-helpers.js');
var chance = require('chance').Chance();
var EC = protractor.ExpectedConditions;

var testParams = {
    schema_name: "faceting",
    table_name: "main",
    filter_secondary_key: {
        facetIdx: 14,
        option: 1,
        modalOption: 1,
        totalNumOptions: 11,
        numRows: 10,
        numRowsAfterModal: 20

    },
    facet_order: [
        {
            title: "facet with order and column_order false for scalar",
            facetIdx: 16,
            modalOptions: ['01', '02', '03', '04', '05', '06', '07'],
            sortable: false,
            modalOptionsSortedByNumOfOccurences: ['07', '06', '05', '04', '03', '02', '01'],
            columnName: "col_w_column_order_false"
        },
        {
            title: "facet without order and hide_num_occurrences: true",
            facetIdx: 17,
            modalOptions: ['01', '13', '12', '11', '10', '09', '08', '07', '06', '05', '04', '03', '02'],
            sortable: true,
            modalOptionsSortedByScalar: ['13', '12', '11', '10', '09', '08', '07', '06', '05', '04', '03', '02', '01'],
            hideNumOccurrences: true,
            columnName: "col_w_column_order"
        }
    ],
    not_null: {
        option: 0,
        result_num_w_not_null: 20,
        modal_available_options: 20,
        disabled_rows_w_not_null: 10,
        options_w_not_null: [
            'All Records With Value', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'
        ],
        options_wo_not_null: [
            'All Records With Value', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'
        ]
    },
    customFilter: {
        ermrestFilter: "id=1;id=2;int_col::geq::20",
        numRows: 7,
        numRowsWFacet: 1,
        numRowsWOFilter: 1,
        facet: 0,
        totalNumOptions: 8,
        options: ["All Records With Value", "1", "2", "6", "7", "8", "9", "10"],
        optionsWOFilter: ["All Records With Value", "2", "1", "3", "4", "5", "6", "7", "8", "9", "10"],
        option: 2
    },
    maximumLength: {
        facetIdx: 18,
        option: 1,
        numRows: 25,
        modalOption: 10,
        totalNumOptions: 26,
        filteredNumRows: 14,
        secondFacetIdx: 6,
        secondFacetOption: 1,
        secondFacetNumOptions: 7
    },
    recordColumns: [ "text_col", "longtext_col", "markdown_col", "int_col", "float_col", "date_col", "timestamp_col", "boolean_col", "jsonb_col", "1-o7Ye2EkulrWcCVFNHi3A", "hmZyP_Ufo3E5v_nmdTXyyA" ],
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
        "1-o7Ye2EkulrWcCVFNHi3A": "one", // faceting_main_fk1
        "hmZyP_Ufo3E5v_nmdTXyyA": "one" // faceting_main_fk2
    },
    glyphLeftClass: "glyphicon-triangle-left",
    glyphRightClass: "glyphicon-triangle-right",
    foreignKeyPopupFacetFilter: "term: eight",
    associationRTName: "main_f3_assoc",
    associationPopupFacetFilter: "term: five",
    associationPopupSelectedRowsFilter: "five"
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

        it('Side panel should hide/show by clicking pull button', function(done){
            var recPan =  chaisePage.recordPage.getSidePanel(),
                fiddlerBtn = chaisePage.recordPage.getSidePanelFiddler();

            expect(fiddlerBtn.getAttribute("class")).toContain(testParams.glyphLeftClass, 'Side Pan Pull button is not pointing in the left direction');
            expect(recPan.getAttribute("class")).toContain('open-panel', 'Side Panel is not visible when fiddler is poining in left direction');

            fiddlerBtn.click().then(function(){
                expect(fiddlerBtn.getAttribute("class")).toContain(testParams.glyphRightClass, "Side Pan Pull button is not pointing in the right direction.");
                expect(recPan.getAttribute("class")).toContain('close-panel', 'Side Panel is not hidden when fiddler is poining in right direction');

                return fiddlerBtn.click();
            }).then(function () {
                done();
            }).catch(chaisePage.catchTestError(done));
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
            }).catch(chaisePage.catchTestError(done));

        });

        it ("the selected value should be selected on the modal.", function (done) {
            var showMore = chaisePage.recordsetPage.getShowMore(idx);
            browser.wait(EC.elementToBeClickable(showMore));
            chaisePage.clickButton(showMore).then(function () {
                chaisePage.waitForElementInverse(element.all(by.id("spinner")).first());

                expect(chaisePage.recordsetPage.getCheckedModalOptions().count()).toBe(1, "number of checked rows missmatch.");
                return chaisePage.recordsetPage.getModalOptions();
            }).then(function (options) {
                expect(options[testParams.filter_secondary_key.option].isSelected()).toBeTruthy("the correct option was not selected.");
                done();
            }).catch(chaisePage.catchTestError(done));
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
            }).catch(chaisePage.catchTestError(done));
        });

    });

    describe("facet modal rows and columns, ", function () {
        var uri = browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schema_name + ":" + testParams.table_name;
        var clearAll, showMore, sortBtn;

        beforeAll(function (done) {
            browser.ignoreSynchronization=true;
            browser.get(uri);
            chaisePage.waitForElementInverse(element(by.id("spinner")));

            clearAll = chaisePage.recordsetPage.getClearAllFilters();
            browser.wait(EC.elementToBeClickable(clearAll));

            clearAll.click().then(function () {
                chaisePage.waitForElementInverse(element(by.id("spinner")));

                done();
            }).catch(chaisePage.catchTestError(done));
        });

        testParams.facet_order.forEach(function (params) {
            describe("for " + params.title + ", ", function () {
                it ("the rows in the modal should honor the given order.", function (done) {
                    chaisePage.clickButton(chaisePage.recordsetPage.getFacetById(params.facetIdx)).then(function () {
                        // wait for facet to open
                        browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getFacetCollapse(params.facetIdx)), browser.params.defaultTimeout);

                        // click on show more
                        var showMore = chaisePage.recordsetPage.getShowMore(params.facetIdx);
                        browser.wait(EC.elementToBeClickable(showMore));
                        return chaisePage.clickButton(showMore);
                    }).then(function () {
                        chaisePage.recordsetPage.waitForInverseModalSpinner();

                        return chaisePage.recordsetPage.getModalFirstColumnValues();
                    }).then(function (values) {
                        expect(values).toEqual(params.modalOptions, "modal options missmatch");
                        done();
                    }).catch(chaisePage.catchTestError(done));
                });

                if (!params.sortable) {
                    it ("the facet column sort option should not be available.", function () {
                        expect(chaisePage.recordsetPage.getColumnSortButton("0").isDisplayed()).toBe(false);
                    });
                } else {
                    it ("users should be able to change the sort to be based on the scalar column.", function (done) {
                        sortBtn = chaisePage.recordsetPage.getColumnSortButton("0");
                        expect(sortBtn.isDisplayed()).toBe(true, "sort button is not available.");
                        chaisePage.clickButton(sortBtn).then(function () {
                            chaisePage.recordsetPage.waitForInverseModalSpinner();
                            return chaisePage.recordsetPage.getModalFirstColumnValues();
                        }).then(function (values) {
                            expect(values).toEqual(params.modalOptionsSortedByScalar, "modal options missmatch");
                            done();
                        }).catch(chaisePage.catchTestError(done));
                    });
                }

                it ("number of Occurrences column should be " + (params.hideNumOccurrences ? "hidden": "available") + ".", function (done) {
                    chaisePage.recordsetPage.getModalColumnNames().then(function (columns) {
                        expect(columns.length).toBe(params.hideNumOccurrences ? 1 : 2, "length missmatch");
                        expect(columns[0].getText()).toBe(params.columnName, "column name missmatch");
                        if (!params.hideNumOccurrences) {
                            expect(columns[1].getText()).toBe("Number of Occurrences", "num of occ column name missmatch.");
                        }
                        done();
                    }).catch(chaisePage.catchTestError(done));
                });

                if (!params.hideNumOccurrences) {
                    it ("numer of Occurrences column should be available and users should be able to sort based on that.", function (done) {
                        sortBtn = chaisePage.recordsetPage.getColumnSortButton("count");
                        expect(sortBtn.isDisplayed()).toBe(true, "sort button is not available.");
                        chaisePage.clickButton(sortBtn).then(function () {
                            chaisePage.recordsetPage.waitForInverseModalSpinner();
                            return chaisePage.recordsetPage.getModalFirstColumnValues();
                        }).then(function (values) {
                            expect(values).toEqual(params.modalOptionsSortedByNumOfOccurences, "modal options missmatch");
                            done();
                        }).catch(chaisePage.catchTestError(done));
                    });
                }

                it ('should close the facet modal', function (done) {
                    chaisePage.recordsetPage.getModalCloseBtn().click().then(function () {
                        done();
                    }).catch(chaisePage.catchTestError(done));
                });
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
            }).catch(chaisePage.catchTestError(done));

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
            }).catch(chaisePage.catchTestError(done));
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
            }).catch(chaisePage.catchTestError(done));
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
            }).catch(chaisePage.catchTestError(done));
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
            }).catch(chaisePage.catchTestError(done));
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
            }).catch(chaisePage.catchTestError(done));
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
            }).catch(chaisePage.catchTestError(done));
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
            chaisePage.recordsetPage.getFacetFilters().then(function (filters) {
                expect(filters.length).toEqual(1, "filter is missing");

                expect(filters[0].getText()).toEqual("Custom Filter: " + customFilterParams.ermrestFilter, "filter text missmatch.");

                expect(chaisePage.recordsetPage.getClearAllFilters().isDisplayed()).toBeTruthy("`Clear All` is not visible");

                done();
            }).catch(chaisePage.catchTestError(done));
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
                // wait for table rows to load
                browser.wait(function () {
                    return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                        return ct == customFilterParams.numRowsWFacet;
                    });
                }, browser.params.defaultTimeout);

                // make sure data has been updated
                expect(chaisePage.recordsetPage.getRows().count()).toBe(customFilterParams.numRowsWFacet, "");

                // make sure filter is there
                expect(chaisePage.recordsetPage.getFacetFilters().count()).toBe(2, "facet filter missing.");


                done();
            }).catch(chaisePage.catchTestError(done));
        });

        it ("clicking on `x` for Custom Filter should only clear the filter.", function (done) {
            expect(chaisePage.recordsetPage.getClearCustomFilters().isDisplayed()).toBeTruthy("`Clear Custom Filters` is not visible.");

            chaisePage.recordsetPage.getClearCustomFilters().click().then(function () {
                chaisePage.waitForElementInverse(element(by.id("spinner")));

                expect(chaisePage.recordsetPage.getRows().count()).toEqual(customFilterParams.numRowsWOFilter, "total row count missmatch.");

                expect(chaisePage.recordsetPage.getFacetOptionsText(idx)).toEqual(customFilterParams.optionsWOFilter, "options missmatch.");

                done();
            }).catch(chaisePage.catchTestError(done));
        });
    });

    describe("regarding URL limitation check, ", function () {
        var uri = browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schema_name + ":" + testParams.table_name;
        var clearAll;
        var alert = chaisePage.recordsetPage.getWarningAlert();
        var submitBtn = chaisePage.recordsetPage.getModalSubmit();
        var idx = testParams.maximumLength.facetIdx;
        var facet = chaisePage.recordsetPage.getFacetById(idx);

        var checkAlert = function () {
            browser.wait(EC.visibilityOf(alert, browser.params.defaultTimeout));
            expect(alert.getText()).toContain("Warning Maximum URL length reached. Cannot perform the requested action.", "alert message missmatch.");
        };

        beforeAll(function (done) {
            browser.ignoreSynchronization=true;
            browser.get(uri);
            chaisePage.waitForElementInverse(element(by.id("spinner")));

            clearAll = chaisePage.recordsetPage.getClearAllFilters();
            browser.wait(EC.elementToBeClickable(clearAll));

            clearAll.click().then(function () {
                chaisePage.waitForElementInverse(element(by.id("spinner")));

                done();
            }).catch(chaisePage.catchTestError(done));
        });

        it ("searching a lenghty string should show the `Maximum URL length reached` warning.", function () {
            var mainSearch = chaisePage.recordsetPage.getMainSearchBox();
            chaisePage.setInputValue(mainSearch, chance.string({length: 2000}));
            chaisePage.recordsetPage.waitForInverseMainSpinner();
            expect(chaisePage.recordsetPage.getRows().count()).toBe(testParams.maximumLength.numRows, "row count missmatch.");
            checkAlert();
        });

        describe("in facet modal, ", function () {
            beforeAll(function (done) {
                chaisePage.clickButton(facet).then(function () {
                    // wait for facet to open
                    browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getFacetCollapse(idx)), browser.params.defaultTimeout);

                    // click on show more
                    var showMore = chaisePage.recordsetPage.getShowMore(idx);
                    browser.wait(EC.elementToBeClickable(showMore));
                    return chaisePage.clickButton(showMore);
                }).then(function () {
                    chaisePage.waitForElementInverse(element.all(by.id("spinner")).first());
                    done();
                }).catch(chaisePage.catchTestError(done));
            });

            it ('after opening the modal, the existing url limit alert should be removed.', function () {
                expect(alert.isPresent()).toBeFalsy();
            });

            it ("alert should be displayed upon reaching the URL limit and submit button should be disabled.", function (done) {
                chaisePage.clickButton(chaisePage.recordsetPage.getSelectAllBtn()).then(function () {
                    checkAlert();
                    expect(submitBtn.getAttribute('disabled')).toBe('true', "submit is not disabled.");
                    done();
                }).catch(chaisePage.catchTestError(done));
            });

            it ("changing filters and going below the URL limit should hide the alert and enable the submit button.", function (done) {
                chaisePage.clickButton(chaisePage.recordsetPage.getModalRecordsetTableOptionByIndex(1)).then(function () {
                    chaisePage.waitForElementInverse(alert);
                    expect(submitBtn.getAttribute('disabled')).not.toBe('true', "submit is disabled.");
                    return chaisePage.clickButton(submitBtn);
                }).then(function () {
                    browser.wait(function () {
                        return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                            return ct == testParams.maximumLength.filteredNumRows;
                        });
                    }, browser.params.defaultTimeout);
                    done();
                }).catch(chaisePage.catchTestError(done));
            });
        });

        describe("in main container, ", function () {
            var secondFacetIdx = testParams.maximumLength.secondFacetIdx;

            it ("alert should be displayed upon reaching the URL limit and the request should not be completed.", function (done) {
                var secondFacet = chaisePage.recordsetPage.getFacetById(secondFacetIdx);

                var secondFacetOption = chaisePage.recordsetPage.getFacetOption(
                    secondFacetIdx,
                    testParams.maximumLength.secondFacetOption
                );

                chaisePage.clickButton(secondFacet).then(function () {
                    // wait for facet to open
                    browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getFacetCollapse(secondFacetIdx)), browser.params.defaultTimeout);

                    browser.wait(function () {
                        return chaisePage.recordsetPage.getFacetOptions(secondFacetIdx).count().then(function(ct) {
                            return ct == testParams.maximumLength.secondFacetNumOptions;
                        });
                    }, browser.params.defaultTimeout);

                    browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getList(secondFacetIdx)), browser.params.defaultTimeout);

                    return chaisePage.clickButton(secondFacetOption);
                }).then(function () {
                        checkAlert();
                        expect(secondFacetOption.isSelected()).toBeFalsy("the option is checked.");
                        done();
                }).catch(chaisePage.catchTestError(done));

            });

            it ("changing filters and going below the URL limit should hide the alert.", function (done) {
                var facetOption = chaisePage.recordsetPage.getFacetOption(
                    idx,
                    testParams.maximumLength.option
                );

                chaisePage.clickButton(facetOption).then(function () {
                    browser.wait(function () {
                        return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                            return ct == testParams.maximumLength.filteredNumRows - 1;
                        });
                    }, browser.params.defaultTimeout);
                    expect(alert.isPresent()).toBeFalsy("alert is visible");
                    done();
                }).catch(chaisePage.catchTestError(done));
            });
        });

    });

    describe("navigating to record and recordedit app with facets.", function () {

        var uri = browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schema_name + ":" + testParams.table_name;
        var clearAll;

        describe("from recordset app with multiple records", function () {

            beforeAll(function (done) {
                browser.ignoreSynchronization=true;
                browser.get(uri);
                chaisePage.waitForElementInverse(element(by.id("spinner")));

                clearAll = chaisePage.recordsetPage.getClearAllFilters();
                browser.wait(EC.elementToBeClickable(clearAll));

                clearAll.click().then(function () {
                    chaisePage.waitForElementInverse(element(by.id("spinner")));

                    done();
                }).catch(chaisePage.catchTestError(done));
            });

            it("clicking edit should show the same number of forms in RE as rows in RS.", function (done) {
                chaisePage.recordsetPage.getEditRecordLink().click().then(function() {
                    browser.wait(function() {
                        return chaisePage.recordEditPage.getForms().count().then(function(ct) {
                            return (ct == 25);
                        });
                    }, browser.params.defaultTimeout);

                    return chaisePage.recordEditPage.getForms().count();
                }).then(function(count) {
                    expect(count).toBe(25);

                    done();
                }).catch(chaisePage.catchTestError(done));
            });
        });

        describe("in recordedit app, foreign key popup should have facets available,", function() {

            var sidePanelBtn;

            beforeAll(function (done) {
                browser.ignoreSynchronization=true;
                browser.get(uri);
                chaisePage.waitForElementInverse(element(by.id("spinner")));

                browser.getCurrentUrl().then(function (url) {
                    var uri = url.replace("recordset", "recordedit");
                    browser.get(uri);

                    chaisePage.waitForElement(element(by.id("submit-record-button")));

                    done();
                }).catch(chaisePage.catchTestError(done));
            });

            it("should click the foreign key popup button and have the facet collapse button visible in search popup", function (done) {
                expect(chaisePage.recordEditPage.getForms().count()).toBe(1, "number of forms shown is incorrect");

                chaisePage.recordEditPage.getModalPopupBtnsUsingScript().then(function(popupBtns) {
                    expect(popupBtns.length).toBe(2, "number of popup buttons is incorrect");

                    return chaisePage.clickButton(popupBtns[0]);
                }).then(function () {
                    browser.wait(EC.visibilityOf(chaisePage.recordEditPage.getModalTitle()), browser.params.defaultTimeout);

                    browser.wait(function () {
                        return chaisePage.recordsetPage.getModalRows().count().then(function (ct) {
                            return (ct == 13);
                        });
                    });

                    // get sidePanFiddler
                    sidePanelBtn = chaisePage.recordPage.getSidePanelFiddler();
                    chaisePage.waitForElement(sidePanelBtn);

                    expect(sidePanelBtn.getAttribute("class")).toContain(testParams.glyphRightClass, "side panel should be closed, button is displayed wrong");
                    done();
                }).catch(chaisePage.catchTestError(done));
            });

            it("clicking the side panel button should open the facet panel", function (done) {
                sidePanelBtn.click().then(function () {
                    var sidePanel = chaisePage.recordPage.getSidePanel();
                    browser.wait(EC.visibilityOf(sidePanel), browser.params.defaultTimeout);

                    expect(sidePanelBtn.getAttribute("class")).toContain(testParams.glyphLeftClass, "side panel should be open, button is displayed wrong");
                    expect(sidePanel.isDisplayed()).toBeTruthy("Side panel is not visible after opening it");
                    done();
                }).catch(chaisePage.catchTestError(done));
            });

            it("select a facet option and select a row for the input", function (done) {
                chaisePage.clickButton(chaisePage.recordsetPage.getFacetOption(0, 1)).then(function () {
                    browser.wait(function () {
                        return chaisePage.recordsetPage.getModalRows().count().then(function (ct) {
                            return (ct == 1);
                        });
                    });

                    return chaisePage.recordsetPage.getFacetFilters();
                }).then(function (filters) {
                    expect(filters[0].getText()).toBe(testParams.foreignKeyPopupFacetFilter, "Filter for facet is incorrect");

                    return chaisePage.recordsetPage.getModalRows().get(0).all(by.css(".select-action-button"));
                }).then(function (selectButtons) {
                    expect(selectButtons.length).toBe(1, "number of selectable rows is incorrect");

                    return selectButtons[0].click();
                }).then(function () {
                    browser.wait(EC.visibilityOf(chaisePage.recordEditPage.getFormTitle()), browser.params.defaultTimeout);

                    var foreignKeyInputDisplay = chaisePage.recordEditPage.getForeignKeyInputDisplay("fk_to_f1", 0);
                    expect(foreignKeyInputDisplay.getText()).toEqual("eight", "Didn't select the expected foreign key.");
                    done();
                }).catch(chaisePage.catchTestError(done));
            });
        });

        describe("in record app, association add popup should have facets available,", function() {

            var sidePanelBtn;

            beforeAll(function (done) {
                browser.ignoreSynchronization=true;
                browser.get(uri);
                browser.switchTo().alert().accept();
                chaisePage.waitForElementInverse(element(by.id("spinner")));

                browser.getCurrentUrl().then(function (url) {
                    var uri = url.replace("recordset", "record");
                    browser.get(uri);

                    chaisePage.waitForElement(element(by.id('tblRecord')));
                    done();
                }).catch(chaisePage.catchTestError(done));
            })

            it("navigating to record with a facet url", function () {
                recordEditHelpers.testRecordAppValuesAfterSubmission(testParams.recordColumns, testParams.recordValues);
            });

            it("should click the add button for an association table and have the facet collapse button visible", function (done) {
                chaisePage.clickButton(chaisePage.recordPage.getAddRecordLink(testParams.associationRTName)).then(function () {
                    browser.wait(EC.visibilityOf(chaisePage.recordEditPage.getModalTitle()), browser.params.defaultTimeout);

                    browser.wait(function () {
                        return chaisePage.recordsetPage.getModalRows().count().then(function (ct) {
                            return (ct == 5);
                        });
                    });

                    // get sidePanFiddler
                    sidePanelBtn = chaisePage.recordPage.getModalSidePanelFiddler();
                    chaisePage.waitForElement(sidePanelBtn);

                    expect(sidePanelBtn.getAttribute("class")).toContain(testParams.glyphRightClass, "side panel should be closed, button is displayed wrong");
                    done();
                }).catch(chaisePage.catchTestError(done));
            });

            it("clicking the side panel button should open the facet panel", function (done) {
                sidePanelBtn.click().then(function () {
                    var sidePanel = chaisePage.recordPage.getModalSidePanel();
                    browser.wait(EC.visibilityOf(sidePanel), browser.params.defaultTimeout);

                    expect(sidePanelBtn.getAttribute("class")).toContain(testParams.glyphLeftClass, "side panel should be open, button is displayed wrong");
                    expect(sidePanel.isDisplayed()).toBeTruthy("Side panel is not visible after opening it");
                    done();
                }).catch(chaisePage.catchTestError(done));
            });

            it("select a facet option and select a row to associate", function (done) {
                chaisePage.clickButton(chaisePage.recordsetPage.getFacetOption(0, 1)).then(function () {
                    browser.wait(function () {
                        return chaisePage.recordsetPage.getRecordsetTableModalOptions().count().then(function (ct) {
                            return (ct == 1);
                        });
                    });

                    return chaisePage.recordsetPage.getFacetFilters();
                }).then(function (filters) {
                    expect(filters[0].getText()).toBe(testParams.associationPopupFacetFilter, "Filter for selected rows is incorrect");

                    var rowCheckbox = chaisePage.recordsetPage.getModalRecordsetTableOptionByIndex(0);

                    return chaisePage.clickButton(rowCheckbox);
                }).then(function () {
                    //verify selected row filter
                    return chaisePage.recordsetPage.getSelectedRowsFilters();
                }).then(function (filters) {
                    expect(filters[0].getText()).toBe(testParams.associationPopupSelectedRowsFilter, "Filter for facet is incorrect");
                    // NOTE: we don't test add here because we aren't trying to test mutating data, but whether the popup behaves appropriately with faceting

                    done();
                }).catch(chaisePage.catchTestError(done));
            });
        });
    });
});
