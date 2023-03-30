var chaisePage = require('../../../utils/chaise.page.js');
var recordEditHelpers = require('../../../utils/recordedit-helpers.js');
var recordSetHelpers = require('../../../utils/recordset-helpers.js');
var chance = require('chance').Chance();
var EC = protractor.ExpectedConditions;

var testParams = {
    schema_name: "faceting",
    table_name: "main",
    filter_secondary_key: {
        facetIdx: 14,
        option: 0,
        selectedModalOption: 0,
        newModalOption: 2,
        totalNumOptions: 10,
        numRows: 10,
        numRowsAfterModal: 11,
        removingOptionsNumRowsAfterModal: 25
    },
    facet_order: [
        {
            title: "facet with order and column_order false for scalar",
            facetIdx: 20,
            modalOptions: ['01', '02', '03', '04', '05', '06', '07'],
            sortable: false,
            modalOptionsSortedByNumOfOccurences: ['07', '06', '05', '04', '03', '02', '01'],
            columnName: "col_w_column_order_false"
        },
        {
            title: "facet without order and hide_num_occurrences true",
            facetIdx: 21,
            modalOptions: ['01', '13', '12', '11', '10', '09', '08', '07', '06', '05', '04', '03', '02'],
            sortable: true,
            modalOptionsSortedByScalar: ['13', '12', '11', '10', '09', '08', '07', '06', '05', '04', '03', '02', '01'],
            hideNumOccurrences: true,
            columnName: "col_w_column_order"
        }
    ],
    not_null: {
        option: 5,
        result_num_w_not_null: 25,
        modal_available_options: 10,
        disabled_rows_w_not_null: 11,
        options_w_not_null: [
            'All records with value', 'No value', 'one', 'Empty', 'two', 'seven', 'eight', 'elevens', 'four', 'six', 'ten', 'three'
        ]
    },
    null_filter: {
        panel: {
            facetIdx: 5,
            totalNumOptions: 12,
            option: 1,
            numRows: 5
        },
        right_join: {
            firstFacet: {
                name: "F3 Entity",
                idx: 16,
                totalNumOptions: 4,
                option: 1,
                numRows: 23
            },
            secondFacet: {
                name: "F5",
                idx:17,
                options: ["All records with value", "one"]
            }
        }
    },
    hide_row_count: {
        hidden: {
            facetIdx: 11,
            displayingText: "Displaying all\n13\nrecords",
            numModalOptions: 13

        },
        shown: {
            facetIdx: 10,
            displayingText: "Displaying all\n12\nof 12 records",
            numModalOptions: 12
        }
    },
    customFilter: {
        ermrestFilter: "id=1;id=2;int_col::geq::20",
        ermrestFilterDisplayed: "id=1; id=2; int_col::geq::20",
        numRows: 7,
        numRowsWFacet: 1,
        numRowsWOFilter: 1,
        facet: 0,
        totalNumOptions: 7,
        options: ["1", "2", "6", "7", "8", "9", "10"],
        optionsWOFilter: ["2", "1", "3", "4", "5", "6", "7", "8", "9", "10"],
        option: 1
    },
    customFacet: {
        cfacet: { "displayname": "Custom Facet Query", "ermrest_path": "id=1;id=2;id=3;id=14;id=15;id=16;id=17;id=18" },
        cfacetBlob: "N4IgJglgzgDgNgQwJ4DsEFsCmIBcIDCArlAC4D26ABAGIIDGmJlAioZgE5IgA0IH67TKQD6MBCQAWuEBDABeAIwBuWXIBMK+QGZNigCy6FAVkMA2QwHZDADhABfIA",
        facet: 10,
        totalNumOptions: 3,
        option: 1,
        numRows: 8,
        numRowsWFacet: 3,
        numRowsWOCustomFacet: 10,
        options: ['No value', 'one', 'two'],
        optionsWOCustomFacet: ['No value', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
    },
    maximumLength: {
        facetIdx: 22,
        numRows: 25,
        filteredNumRows: 24,
        secondFacetIdx: 6,
        secondFacetOption: 7,
        secondFacetNumOptions: 10,
        option: 1
    },
    recordColumns: [ "text_col", "longtext_col", "markdown_col", "int_col", "float_col", "date_col", "timestamp_col", "boolean_col", "jsonb_col", "1-o7Ye2EkulrWcCVFNHi3A", "hmZyP_Ufo3E5v_nmdTXyyA" ],
    recordValues: {
        text_col: "one",
        longtext_col: "lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc scelerisque vitae nisl tempus blandit. Nam at tellus sit amet ex consequat euismod. Aenean placerat dui a imperdiet dignissim. Fusce non nulla sed lectus interdum consequat. Praesent vehicula odio ut mauris posuere semper sit amet vitae enim. Vivamus faucibus quam in felis commodo eleifend. Nunc varius sit amet est eget euismod. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc scelerisque vitae nisl tempus blandit. Nam at tellus sit amet ex consequat euismod. Aenean placerat dui a imperdiet dignissim. Fusce non nulla sed lectus interdum consequat. Praesent vehicula odio ut mauris posuere semper sit amet vitae enim. Vivamus faucibus quam in felis commodo eleifend. Nunc varius sit amet est eget euismod. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc scelerisque vitae nisl tempus blandit. Nam at tellus sit amet ex consequat euismod. Aenean placerat dui a imperdiet dignissim. Fusce non nulla sed lectus interdum consequat. Praesent vehicula odio ut mauris posuere semper sit amet vitae enim. Vivamus faucibus quam in felis commodo eleifend. Nunc varius sit amet est eget euismod. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc scelerisque vitae nisl tempus blandit. Nam at tellus sit amet ex consequat euismod. Aenean placerat dui a imperdiet dignissim. Fusce non nulla sed lectus interdum consequat. Praesent vehicula odio ut mauris posuere semper sit amet vitae enim. Vivamus faucibus quam in felis commodo eleifend. Nunc varius sit amet est eget euismod.",
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
    shared_path_prefix: {
        facetObject: {
            "and": [
                {"sourcekey": "outbound_to_f1", "choices": [1, 2, 3, 4, 5, 6]},
                {"sourcekey": "outbound_to_f1_to_outbound1", "choices": [3, 4]}
            ]
        },
        facetBlob: [
            "N4IghgdgJiBcDaoDOB7ArgJwMYFMDWOAnnCOgC4BG60A+mSjQGYCMIANCFgBYoCWuSOPGZsATGwDMbACxsArGwBsAXQC+bZOmz4iJclTS16TZnQb7qUVh258BQqdLVqgA"
        ].join(""),
        numRows: 2,
        firstFacet: {
            index: 10,
            options: ["No value", "one", "two", "three", "four", "five", "six"],
            modalOptions: ["three", "four"]
        },
        secondFacet: {
            index: 19,
            options: ["three (o1)", "four (o1)", "one (o1)", "six (o1)"],
            modalOptions: ["1", "3", "4", "6"]
        }
    },
    unsupported_filters_error: {
        facetObject: {
            "and": [
              // will be ignored because of invalid sourcekey name
              {
                "sourcekey": "some_invalid_key",
                "markdown_name": "Facet 1",
                "choices": ["1", "2"]
              },
              // will be ignored because it's ending in f4 table not f5:
              {
                "sourcekey": "path_to_f4_scalar_w_id",
                "markdown_name": "from_name",
                "source_domain": {
                  "schema": "faceting",
                  "table": "f5"
                },
                "choices": ["3", "4"]
              },
              // partially will be ignored
              {
                "sourcekey": "outbound_to_f1",
                "markdown_name": "F1",
                "source_domain": {
                  "schema": "faceting",
                  "table": "f1",
                  "column": "term"
                },
                "choices": ["one", "missing data", "two", "three", "four", "more missing data"]
              }
            ]
        },
        facetBlob: [
            "N4IghgdgJiBcDaoDOB7ArgJwMYFMDWOAnnCKgLY4D6AlhAG5gA21UlBxANCGWBnlCgDuEShDAUSAMTC4ALg",
            "AIAjCC5YAFimq4kceCGVcATCAC6AXw7J02fERIAHMLLWVZKSgDMALJSRYmvJSCNDBcPHwCwqLiOCQeGChk0",
            "RJcqJi4lAI8tHDI6jg8cTI4srQA5iogsmAARoyxsCAeAKwgFiDqmtq6IADMlV6mFlbptsSN6LI16NCu7h4G",
            "3Lz8QiJiEo2Si2k2mYlgObB5agVgRXLlldV1DU2LWCiMaGQQJLI4GGRtqhpaODoIEAoCCxMLUJBIcryKBOM",
            "5cWSCFBXNQYHCgprWSpkFCo+RkcGQiBlaGwobmIA"
        ].join(""),
        errorTitle: "Unsupported Filters",
        errorMessage: [
            "Some (or all) externally supplied filter criteria cannot be implemented with the current catalog content. ",
            "This may be due to lack of permissions or changes made to the content since the criteria were initially saved.\n",
            "Discarded facets: Facet 1, from_name\n",
            "Facets with some discarded choices: F1\n\n\n",
            "Click OK to continue with the subset of filter criteria which are supported at this time.",
            "\nShow Error Details"
        ].join(""),
        errorDetails: [
            "Discarded facets:\n\n- Facet 1 (2 choices):\n  - 1\n  - 2\n- from_name (2 choices):\n  - 3\n  - 4\n\n\n",
            "Partially discarded facets:\n\n- F1 (2/6 choices):\n  - missing data\n  - more missing data"
        ].join(""),
        facetBlobAfterOK: [
            "N4IghgdgJiBcDaoDOB7ArgJwMYFM6JHQBcAjdafEAMzFyIEsIBzEAGhAFsxGB9KgawCMIALoBfdvRgj2WABYp6uJPgAsrQawDMrAEzjxQA"
        ].join(""),
        numRows: 22
    },
    hide_selected_items: {
      // not used and only added here so we know what the blob represents
      facetObject: {
        "and": [
          {"source": "id", "choices": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]},
          {"source": "text_col", "choices": ["one", "two"]}
        ]
      },
      facetBlob: 'N4IghgdgJiBcDaoDOB7ArgJwMYFM4gEsYAaELACxQNyTngEZiAmYgZmIBZiBWYgNmIB2YgA5iATmL0ADFMb0mAXQC+xZOmx5YIAC44AHjoD6WFABsQpClRp0QKCHlI6A7ihAqVQA',
      numRows: 10,
      firstFacet: {
        index: 0,
        options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
        optionsAfterFirstChange: ["2", "3", "4", "5", "6", "7", "8", "9", "10", "11"],
        optionsAfterFinalChange: ["4", "5", "6", "7", "8", "9", "10", "11", "12", "1"],
      },
      secondFacet: {
        index: 5,
        selectedOption: 3,
        options: ["All records with value", "No value", "one", "two", "four", "three"]
      }
    },
    hideFilterPanelClass: "chaise-sidebar-close",
    showFilterPanelClass: "chaise-sidebar-open",
    foreignKeyPopupFacetFilter: "term\neight",
    associationRTName: "main_f3_assoc",
    associationPopupFacetFilter: "term\nfive",
    associationPopupSelectedRowsFilter: "five"
};


describe("Other facet features, ", function() {

    describe("selecting entity facet that is not on the shortest key.", function () {
        var facet, idx, clearAll;
        beforeAll(function (done) {
            var uri = browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schema_name + ":" + testParams.table_name;

            chaisePage.navigate(uri);

            clearAll = chaisePage.recordsetPage.getClearAllFilters();
            chaisePage.waitForElement(clearAll);

            idx = testParams.filter_secondary_key.facetIdx;
            facet = chaisePage.recordsetPage.getFacetHeaderButtonById(idx);

            chaisePage.clickButton(clearAll).then(function () {
                done()
            }).catch(chaisePage.catchTestError(done));
        });

        it('Side panel should hide/show by clicking pull button', function(done){
            var recPan =  chaisePage.recordsetPage.getSidePanel(),
                showPanelBtn = chaisePage.recordsetPage.getShowFilterPanelBtn(),
                hidePanelBtn = chaisePage.recordsetPage.getHideFilterPanelBtn();

            expect(hidePanelBtn.isDisplayed()).toBeTruthy('hide filter panel not visible.');
            expect(recPan.getAttribute("class")).toContain('open-panel', 'Side Panel is not visible');

            hidePanelBtn.click().then(function(){
                expect(showPanelBtn.isDisplayed()).toBeTruthy('show filter panel not visible.');
                expect(recPan.getAttribute("class")).toContain('close-panel', 'Side Panel is not hidden');

                return showPanelBtn.click();
            }).then(function () {
                done();
            }).catch(chaisePage.catchTestError(done));
        });

        it("should open the facet, select a value to filter on.", function (done) {
            chaisePage.clickButton(facet).then(function () {
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

                browser.wait(function () {
                    return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                        return ct == testParams.filter_secondary_key.numRows;
                    });
                }, browser.params.defaultTimeout);

                return chaisePage.recordsetPage.getRows().count();
            }).then(function (ct) {
                expect(ct).toBe(testParams.filter_secondary_key.numRows, "number of rows is incorrect");
                done();
            }).catch(chaisePage.catchTestError(done));
        });

        it ("the selected value should be selected on the modal.", function (done) {
            chaisePage.clickButton(chaisePage.recordsetPage.getShowMore(idx)).then(function () {
                browser.wait(function () {
                    return chaisePage.recordsetPage.getModalOptions().count().then(function(ct) {
                        return ct == 12;
                    });
                }, browser.params.defaultTimeout);

                expect(chaisePage.recordsetPage.getCheckedModalOptions().count()).toBe(1, "number of checked rows missmatch.");
                return chaisePage.recordsetPage.getModalOptions();
            }).then(function (options) {
                expect(options[testParams.filter_secondary_key.selectedModalOption].isSelected()).toBeTruthy("the correct option was not selected.");
                done();
            }).catch(chaisePage.catchTestError(done));
        });

        it ("selecting new values on the modal and submitting them, should change the filters on submit.", function (done) {
            chaisePage.recordsetPage.getModalOptions().then(function (options) {
                return chaisePage.clickButton(options[testParams.filter_secondary_key.newModalOption]);
            }).then(function () {
                expect(chaisePage.recordsetPage.getModalSubmit().getText()).toBe("Submit", "Submit button text for add pure and binary popup is incorrect");

                return chaisePage.clickButton(chaisePage.recordsetPage.getModalSubmit());
            }).then(function () {

                browser.wait(function() {
                    return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                        return (ct == testParams.filter_secondary_key.numRowsAfterModal);
                    });
                }, browser.params.defaultTimeout, "number of visible rows after selecting a second option missmatch.");

                browser.wait(function() {
                    return  chaisePage.recordsetPage.getCheckedFacetOptions(idx).count().then(function(ct) {
                        return (ct == 2);
                    });
                }, browser.params.defaultTimeout, "Number of facet options is incorrect after returning from modal");

                done();
            }).catch(chaisePage.catchTestError(done));
        });

        it ("removing values in the modal should allow for submitting to remove the set of selected options for that facet.", function (done) {
            chaisePage.clickButton(chaisePage.recordsetPage.getShowMore(idx)).then(function () {
                browser.wait(function() {
                    return  chaisePage.recordsetPage.getCheckedModalOptions().count().then(function(ct) {
                        return (ct == 2);
                    });
                }, browser.params.defaultTimeout, "number of checked rows mismatch.");

                // clear selections in modal to remove selections in facet
                return chaisePage.recordsetPage.getModalClearSelection(chaisePage.searchPopup.getFacetPopup()).click();
            }).then(function () {
                expect(chaisePage.recordsetPage.getCheckedModalOptions().count()).toBe(0, "number of checked rows missmatch after clearing selection.");

                return chaisePage.clickButton(chaisePage.recordsetPage.getModalSubmit());
            }).then(function () {
                browser.wait(function() {
                    return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                        return (ct == testParams.filter_secondary_key.removingOptionsNumRowsAfterModal);
                    });
                }, browser.params.defaultTimeout, "number of visible rows after selecting a second option missmatch.");

                browser.wait(function() {
                    return  chaisePage.recordsetPage.getCheckedFacetOptions(idx).count().then(function(ct) {
                        return (ct == 0);
                    });
                }, browser.params.defaultTimeout, "Number of facet options is incorrect after returning from modal");

                //no need to clear all filters, this test removed the last selected facet options
                done();
            }).catch(chaisePage.catchTestError(done));
        });

    });

    describe("facet modal rows and columns, ", function () {
        var uri = browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schema_name + ":" + testParams.table_name;
        var clearAll, showMore, sortBtn;

        beforeAll(function (done) {

            // using browser.get with the same uri doesn't work, so we should just refresh
            chaisePage.navigate(uri);

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
                    chaisePage.clickButton(chaisePage.recordsetPage.getFacetHeaderButtonById(params.facetIdx)).then(function () {
                        // wait for facet to open
                        browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getFacetCollapse(params.facetIdx)), browser.params.defaultTimeout);

                        // click on show more
                        var showMore = chaisePage.recordsetPage.getShowMore(params.facetIdx);
                        browser.wait(EC.elementToBeClickable(showMore));
                        return chaisePage.clickButton(showMore);
                    }).then(function () {
                        chaisePage.recordsetPage.waitForInverseModalSpinner();
                        browser.wait(function () {
                            return chaisePage.recordsetPage.getModalFirstColumn().then(function(values) {
                                return values.length == params.modalOptions.length;
                            });
                        }, browser.params.defaultTimeout);

                        return chaisePage.recordsetPage.getModalFirstColumn();
                    }).then(function (values) {
                        values.forEach(function (val, idx) {
                            expect(val.getText()).toEqual(params.modalOptions[idx], "modal options missmatch");
                        });

                        done();
                    }).catch(chaisePage.catchTestError(done));
                });

                if (!params.sortable) {
                    it ("the facet column sort option should not be available.", function () {
                        expect(chaisePage.recordsetPage.getColumnSortButton("0").isPresent()).toBe(false);
                    });
                } else {
                    it ("users should be able to change the sort to be based on the scalar column.", function (done) {
                        sortBtn = chaisePage.recordsetPage.getColumnSortButton("0");
                        expect(sortBtn.isDisplayed()).toBe(true, "sort button is not available.");
                        chaisePage.clickButton(sortBtn).then(function () {
                            chaisePage.recordsetPage.waitForInverseModalSpinner();

                            // this will wait for the list to be the same as expected, otherwise will timeout
                            browser.wait(function () {
                                return chaisePage.recordsetPage.getModalFirstColumn().getText().then(function (texts) {
                                    return JSON.stringify(texts) === JSON.stringify(params.modalOptionsSortedByScalar);
                                }).catch(chaisePage.catchTestError(done));
                            }, browser.params.defaultTimeout);

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

                            browser.wait(function () {
                                return chaisePage.recordsetPage.getModalFirstColumn().then(function(values) {
                                    return values.length == params.modalOptionsSortedByNumOfOccurences.length;
                                });
                            }, browser.params.defaultTimeout);

                            browser.sleep(75);

                            return chaisePage.recordsetPage.getModalFirstColumn();
                        }).then(function (values) {
                            values.forEach(function (val, idx) {
                                expect(val.getText()).toEqual(params.modalOptionsSortedByNumOfOccurences[idx], "modal options missmatch");
                            });

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
        var notNullBtn, showMore, facet;

        beforeAll(function (done) {
            var uri = browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schema_name + ":" + testParams.table_name;

            chaisePage.navigate(uri);
            chaisePage.waitForElementInverse(element(by.id("spinner")));

            clearAll = chaisePage.recordsetPage.getClearAllFilters();
            browser.wait(EC.elementToBeClickable(clearAll));

            clearAll.click().then(function () {
                chaisePage.waitForElementInverse(element(by.id("spinner")));

                facet = chaisePage.recordsetPage.getFacetHeaderButtonById(testParams.not_null.option);

                return chaisePage.clickButton(facet);
            }).then(function () {
                showMore = chaisePage.recordsetPage.getShowMore(testParams.not_null.option);
                notNullBtn = chaisePage.recordsetPage.getFacetOption(testParams.not_null.option, 0);
                done();
            }).catch(chaisePage.catchTestError(done));
        });

        it ("`All Records with value` option must be available in facet panel.", function (done) {
            // make sure facet is loaded
            browser.wait(EC.elementToBeClickable(showMore));
            browser.wait(function () {
                return chaisePage.recordsetPage.getFacetOptions(testParams.not_null.option).count().then(function(ct) {
                    return ct == 12;
                });
            }, browser.params.defaultTimeout);

            chaisePage.recordsetPage.getFacetOptions(testParams.not_null.option).then(function (opts) {
                opts.forEach(function (option, idx) {
                    expect(option.getText()).toEqual(testParams.not_null.options_w_not_null[idx], "the options are not the same.");
                });

                done();
            }).catch(chaisePage.catchTestError(done));
        });

        it ("After clicking on `All records with value`, the rest of options must be disabled", function (done) {

            chaisePage.clickButton(notNullBtn).then(function () {
                browser.wait(function () {
                    return chaisePage.recordsetPage.getCheckedFacetOptions(testParams.not_null.option).count().then(function(ct) {
                        return ct == 1;
                    });
                }, browser.params.defaultTimeout);

                return chaisePage.recordsetPage.getCheckedFacetOptions(testParams.not_null.option).count()
            }).then(function (count) {
                expect(count).toBe(1, "number of selected filters missmatch.");

                return chaisePage.recordsetPage.getFacetOptions(testParams.not_null.option);
            }).then(function (opts) {
                opts.forEach(function (option, idx) {
                    expect(option.getText()).toEqual(testParams.not_null.options_w_not_null[idx], "the text of selected faacet missmatch.");
                });

                expect(chaisePage.recordsetPage.getDisabledFacetOptions(testParams.not_null.option).count()).toBe(testParams.not_null.disabled_rows_w_not_null, "numer of disabled filters missmatch.");
                expect(chaisePage.recordsetPage.getRows().count()).toBe(testParams.not_null.result_num_w_not_null, "number of results missmatch.");

                done();
            }).catch(chaisePage.catchTestError(done));
        });

        it ("Deselecting `All records with value` should enable all the values on the list.", function (done) {
            chaisePage.clickButton(notNullBtn).then(function () {
                return chaisePage.recordsetPage.getFacetOptions(testParams.not_null.option);
            }).then(function (opts) {
                // make sure the options havn't changed
                opts.forEach(function (option, idx) {
                    expect(option.getText()).toEqual(testParams.not_null.options_w_not_null[idx], "the text of selected faacet missmatch.");
                });

                // expect(chaisePage.recordsetPage.getModalMatchNullInput().getAttribute('disabled')).not.toBe('true', "null option is still disabled.");
                expect(chaisePage.recordsetPage.getCheckedFacetOptions(testParams.not_null.option).count()).toBe(0, "number of selected filters missmatch.");
                expect(chaisePage.recordsetPage.getDisabledFacetOptions(testParams.not_null.option).count()).toBe(0, "numer of disabled filters missmatch.");

                done();
            }).catch(chaisePage.catchTestError(done));
        });

        it ("should be able to select other filters on the facet.", function (done) {
            chaisePage.clickButton(chaisePage.recordsetPage.getFacetOption(testParams.not_null.option, 1)).then(function () {
                return chaisePage.recordsetPage.getFacetOptions(testParams.not_null.option);
            }).then(function (opts) {
                // make sure the options havn't changed
                opts.forEach(function (option, idx) {
                    expect(option.getText()).toEqual(testParams.not_null.options_w_not_null[idx], "the text of selected faacet missmatch.");
                });

                expect(chaisePage.recordsetPage.getCheckedFacetOptions(testParams.not_null.option).count()).toBe(1, "Number of selected filters missmatch.");
                expect(chaisePage.recordsetPage.getDisabledFacetOptions(testParams.not_null.option).count()).toBe(0, "numer of disabled filters missmatch.");

                done();
            }).catch(chaisePage.catchTestError(done));
        });

        it ("Selecting `All records with value` in the list, should remove all the checked filters on facet.", function (done) {
            chaisePage.clickButton(notNullBtn).then(function () {
                return chaisePage.recordsetPage.getFacetOptions(testParams.not_null.option);
            }).then(function (opts) {
                // make sure the options haven't changed
                opts.forEach(function (option, idx) {
                    expect(option.getText()).toEqual(testParams.not_null.options_w_not_null[idx], "the text of selected faacet missmatch.");
                });

                expect(chaisePage.recordsetPage.getCheckedFacetOptions(testParams.not_null.option).count()).toBe(1, "number of selected filters missmatch.");
                expect(chaisePage.recordsetPage.getDisabledFacetOptions(testParams.not_null.option).count()).toBe(testParams.not_null.disabled_rows_w_not_null, "numer of disabled filters missmatch.");

                done();
            }).catch(chaisePage.catchTestError(done));
        });
    });

    describe("No value (null) filter, ", function () {
        var uri = browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schema_name + ":" + testParams.table_name;
        var clearAll, showMore, nullBtn;

        beforeAll(function (done) {
            // using browser.get with the same uri doesn't work, so we should just refresh
            chaisePage.navigate(uri)
            chaisePage.waitForElementInverse(element(by.id("spinner")));

            clearAll = chaisePage.recordsetPage.getClearAllFilters();
            browser.wait(EC.elementToBeClickable(clearAll));

            clearAll.click().then(function () {
                chaisePage.waitForElementInverse(element(by.id("spinner")));
                done();
            }).catch(chaisePage.catchTestError(done));
        });

        it ("null should be provided as an option and user should be able to select it.", function (done) {
            var params = testParams.null_filter.panel;
            chaisePage.recordsetPage.getFacetHeaderButtonById(params.facetIdx).click().then(function () {
                // wait for facet checkboxes to load
                browser.wait(function () {
                    return chaisePage.recordsetPage.getFacetOptions(params.facetIdx).count().then(function(ct) {
                        return ct == params.totalNumOptions;
                    });
                }, browser.params.defaultTimeout);

                return chaisePage.clickButton(chaisePage.recordsetPage.getFacetOption(params.facetIdx, params.option));
            }).then(function () {
                browser.wait(function () {
                    return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                        return ct == params.numRows;
                    });
                }, browser.params.defaultTimeout);

                // clear the selected facet
                return clearAll.click();
            }).then(function () {
                chaisePage.recordsetPage.waitForInverseMainSpinner();
                done();
            }).catch(chaisePage.catchTestError(done));
        });

        describe("regarding facets that require right join, ", function () {
            var params = testParams.null_filter.right_join, idx;
            it ("null should be provided as an option and user should be able to select it.", function (done) {
                idx = params.firstFacet.idx;
                chaisePage.recordsetPage.getFacetHeaderButtonById(idx).click().then(function () {
                    browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getFacetCollapse(idx)), browser.params.defaultTimeout);

                    // wait for facet checkboxes to load
                    browser.wait(function () {
                        return chaisePage.recordsetPage.getFacetOptions(idx).count().then(function(ct) {
                            return ct == params.firstFacet.totalNumOptions;
                        });
                    }, browser.params.defaultTimeout);

                    return chaisePage.clickButton(chaisePage.recordsetPage.getFacetOption(idx, params.firstFacet.option));
                }).then(function () {
                    browser.wait(function () {
                        return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                            return ct == params.firstFacet.numRows;
                        });
                    }, browser.params.defaultTimeout);
                    done();
                }).catch(chaisePage.catchTestError(done));
            });

            it ("after selecting one, other such facets should not provide null option.", function (done) {
                recordSetHelpers.openFacetAndTestFilterOptions(
                    params.secondFacet.name, params.secondFacet.idx, params.secondFacet.options, done
                );
            });
        });
    });

    /***********************************************************  local test cases ***********************************************************/
    if (process.env.CI) return;
    // NOTE the following test cases will only run locally.

    describe('regarding the logic to show only certian number of selected items,', function () {
        var uriPrefix = browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schema_name + ":" + testParams.table_name;
        var currParams = testParams.hide_selected_items;
        const facetIdx = currParams.firstFacet.index;
        const secondFacetIdx = currParams.secondFacet.index;

        beforeAll(function(done) {
            var uri = uriPrefix + "/*::facets::" + currParams.facetBlob;
            chaisePage.navigate(uri);
            chaisePage.waitForElementInverse(element(by.id("spinner")));
            done();
        });

        it ('facet panel should only show limited number of selected facet options.', function (done) {
            // wait for facet to open
            browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getFacetCollapse(facetIdx)), browser.params.defaultTimeout);

            // wait for list to be fully visible
            browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getList(facetIdx)), browser.params.defaultTimeout);

            // wait for facet checkboxes to load
            browser.wait(function () {
                return chaisePage.recordsetPage.getFacetOptions(facetIdx).getText().then(function (opts) {
                    return JSON.stringify(opts) === JSON.stringify(currParams.firstFacet.options);
                }).catch(chaisePage.catchTestError(done));
            }, browser.params.defaultTimeout);

            // make sure all are selected
            expect(chaisePage.recordsetPage.getCheckedFacetOptions(0).count()).toBe(currParams.firstFacet.options.length, 'not all options are selected');

            // make sure the text is visible
            expect(chaisePage.recordsetPage.getFacetMoreFiltersText(facetIdx).getText()).toEqual('2 selected items not displayed.');

            done();
        });

        it ('interacting with other facet should rearrange the options and update the message.', function (done) {
            // deselect the first option in the first facet
            chaisePage.clickButton(chaisePage.recordsetPage.getFacetOption(facetIdx, 0)).then(() => {
                // wait for list to be fully visible
                browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getList(secondFacetIdx)), browser.params.defaultTimeout);

                // in the second facet, deselect third option (first two are not-null and null)
                return chaisePage.clickButton(chaisePage.recordsetPage.getFacetOption(secondFacetIdx, currParams.secondFacet.selectedOption));
            }).then(() => {
                  // wait for facet checkboxes to load for the first facet
                  browser.wait(function () {
                      return chaisePage.recordsetPage.getFacetOptions(facetIdx).getText().then(function (opts) {
                          return JSON.stringify(opts) === JSON.stringify(currParams.firstFacet.optionsAfterFirstChange);
                      }).catch(chaisePage.catchTestError(done));
                  }, browser.params.defaultTimeout);

                  // make sure all are selected
                  expect(chaisePage.recordsetPage.getCheckedFacetOptions(0).count()).toBe(currParams.firstFacet.optionsAfterFirstChange.length, 'not all options are selected');

                  // make sure the text is updated
                  expect(chaisePage.recordsetPage.getFacetMoreFiltersText(facetIdx).getText()).toEqual('1 selected items not displayed.');

                  done();
            }).catch(chaisePage.catchTestError(done));

        });

        it ('going below the limit should remove the message.', function (done) {
          // deselect first and second options in the first facet so we go below the limit
          chaisePage.clickButton(chaisePage.recordsetPage.getFacetOption(facetIdx, 0)).then(() => {
              return chaisePage.clickButton(chaisePage.recordsetPage.getFacetOption(facetIdx, 1));
          }).then(() => {
              // in the second facet, deselect third option (first two are not-null and null)
              return chaisePage.clickButton(chaisePage.recordsetPage.getFacetOption(secondFacetIdx, currParams.secondFacet.selectedOption));
          }).then (() => {
              // wait for facet checkboxes to load
              browser.wait(function () {
                  return chaisePage.recordsetPage.getFacetOptions(facetIdx).getText().then(function (opts) {
                      return JSON.stringify(opts) === JSON.stringify(currParams.firstFacet.optionsAfterFinalChange);
                  }).catch(chaisePage.catchTestError(done));
              }, browser.params.defaultTimeout);

              // make sure the text has disapeared
              expect(chaisePage.recordsetPage.getFacetMoreFiltersText(facetIdx).isDisplayed()).toBeFalsy();

              done();
          }).catch(chaisePage.catchTestError(done));
        });
    });

    describe("regarding facets with shared path,", function () {
        var uriPrefix = browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schema_name + ":" + testParams.table_name;
        var currParams = testParams.shared_path_prefix;

        beforeAll(function(done) {
            var uri = uriPrefix + "/*::facets::" + currParams.facetBlob;
            chaisePage.navigate(uri);
            chaisePage.waitForElementInverse(element(by.id("spinner")));
            done();
        });

        it ("the main results should be correct", function (done) {
            // wait for table rows to load
            // NOTE 2 rows
            browser.wait(function () {
                return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                    return ct == currParams.numRows;
                });
            }, browser.params.defaultTimeout);

            // the wait itself is doing the test
            done();
        });

        describe("for the facet with subset path, ", function () {
            recordSetHelpers.testFacetOptions(
                currParams.firstFacet.index,
                currParams.firstFacet.options,
                currParams.firstFacet.modalOptions
            );
        });

        describe("for the facet with superset path, ", function () {
            recordSetHelpers.testFacetOptions(
                currParams.secondFacet.index,
                currParams.secondFacet.options,
                currParams.secondFacet.modalOptions
            );
        });
    });

    describe("regarding UnsupportedFilters handling, ", function () {
        var uriPrefix = browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schema_name + ":" + testParams.table_name;
        var currParams = testParams.unsupported_filters_error;

        beforeAll(function() {
            var uri = uriPrefix + "/*::facets::" + currParams.facetBlob;
            chaisePage.navigate(uri);
            chaisePage.waitForElement(element(by.css('.modal-dialog ')));
        });

        it('Proper error should be displayed', function(){
            var modalTitle = chaisePage.errorModal.getTitle();
            expect(modalTitle.getText()).toBe("Unsupported Filters");
        });

        it('Error modal message must summarize the issue', function(){
            var modalText = chaisePage.errorModal.getBody();
            expect(modalText.getText()).toEqual(currParams.errorMessage, "The message in modal pop is not correct");
        });

        it('Error modal should Show Error Details', function(done){
            var showDetails = chaisePage.errorModal.getToggleDetailsLink();
            var errorDetails = chaisePage.errorModal.getErrorDetails();
            chaisePage.waitForElement(showDetails);
            showDetails.click().then(function(){
                chaisePage.waitForElement(errorDetails);
                expect(showDetails.getText()).toBe("Hide Error Details", "The Show/Hide message in modal pop is not correct");
                expect(errorDetails.getText()).toEqual(currParams.errorDetails, "error missmatch.");
                done();
            }).catch(chaisePage.catchTestError(done));
        });

        it('On click of OK button the page should dismiss the error and show proper results', function(done){
            const modalOkBtn = chaisePage.errorModal.getOKButton();
            browser.wait(protractor.ExpectedConditions.elementToBeClickable(modalOkBtn), browser.params.defaultTimeout);
            chaisePage.clickButton(modalOkBtn).then (function (){
                // make sure it's showing proper number of values
                browser.wait(function () {
                    return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                        return ct == currParams.numRows;
                    });
                }, browser.params.defaultTimeout);

                return browser.driver.getCurrentUrl();
            }).then (function(currentUrl) {

                var newURL = uriPrefix + "/*::facets::" + currParams.facetBlobAfterOK;
                expect(currentUrl).toContain(newURL, "The redirection from record page to recordset in case of multiple records failed");
                done();
            }).catch(chaisePage.catchTestError(done));
        });

    });

    describe("regarding hide_row_count support in entity facet popups", function () {
        beforeAll(function (done) {
            var uri = browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schema_name + ":" + testParams.table_name;

            chaisePage.navigate(uri);
            chaisePage.waitForElementInverse(element.all(by.id("spinner")).first());

            clearAll = chaisePage.recordsetPage.getClearAllFilters();
            chaisePage.waitForElement(clearAll);
            chaisePage.clickButton(clearAll).then(function () {
                done()
            }).catch(chaisePage.catchTestError(done));
        });

        it ("should hide the total count when hide_row_count=true", function (done) {
            // facet is already open so we don't have to click to open
            var facetParams = testParams.hide_row_count.hidden;
            var showMore = chaisePage.recordsetPage.getShowMore(facetParams.facetIdx);
            browser.wait(EC.elementToBeClickable(showMore));
            chaisePage.clickButton(showMore).then(function () {
                chaisePage.recordsetPage.waitForInverseModalSpinner();
                browser.wait(function () {
                    return chaisePage.recordsetPage.getModalFirstColumn().then(function(values) {
                        return values.length == facetParams.numModalOptions;
                    });
                }, browser.params.defaultTimeout);

                expect(chaisePage.recordsetPage.getModalTotalCount(chaisePage.searchPopup.getFacetPopup()).getText()).toBe(facetParams.displayingText, "hide_row_count not honored");

                return chaisePage.recordsetPage.getModalCloseBtn().click();
            }).then(function (){
                done();
            }).catch(chaisePage.catchTestError(done));
        });

        it ("otherwise should show the total count", function (done) {
            var facetParams = testParams.hide_row_count.shown;
            var facet = chaisePage.recordsetPage.getFacetHeaderButtonById(facetParams.facetIdx);

            // open the facet first and then open the modal
            chaisePage.clickButton(facet).then(function () {
                var showMore = chaisePage.recordsetPage.getShowMore(facetParams.facetIdx);
                browser.wait(EC.elementToBeClickable(showMore));
                return chaisePage.clickButton(showMore)
            }).then(function () {
                chaisePage.recordsetPage.waitForInverseModalSpinner();
                browser.wait(function () {
                    return chaisePage.recordsetPage.getModalFirstColumn().then(function(values) {
                        return values.length == facetParams.numModalOptions;
                    });
                }, browser.params.defaultTimeout);

                expect(chaisePage.recordsetPage.getModalTotalCount(chaisePage.searchPopup.getFacetPopup()).getText()).toBe(facetParams.displayingText, "hide_row_count not honored");

                return chaisePage.recordsetPage.getModalCloseBtn().click();
            }).then(function (){
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

            chaisePage.navigate(uri);
            chaisePage.waitForElementInverse(element(by.id("spinner")));
        });

        it ("should show the applied filter and clear all button.", function (done) {
            browser.wait(function () {
                return chaisePage.recordsetPage.getFacetFilters().count().then(function(ct) {
                    return ct == 1;
                });
            }, browser.params.defaultTimeout);

            chaisePage.recordsetPage.getFacetFilters().then(function (filters) {
                expect(filters.length).toEqual(1, "filter is missing");

                expect(filters[0].getText()).toEqual("Custom Filter\n" + customFilterParams.ermrestFilterDisplayed, "filter text missmatch.");

                expect(chaisePage.recordsetPage.getClearAllFilters().isDisplayed()).toBeTruthy("`Clear All` is not visible");

                done();
            }).catch(chaisePage.catchTestError(done));
        });

        it ("main and faceting data should be based on the filter, and be able to apply new filters.", function (done) {
            // main
            browser.wait(function () {
                return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                    return ct == customFilterParams.numRows;
                });
            }, browser.params.defaultTimeout);
            expect(chaisePage.recordsetPage.getRows().count()).toEqual(customFilterParams.numRows, "total row count missmatch.");

            chaisePage.clickButton(chaisePage.recordsetPage.getFacetHeaderButtonById(idx)).then(function () {
                browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getFacetCollapse(idx)), browser.params.defaultTimeout);

                // wait for facet checkboxes to load
                browser.wait(function () {
                    return chaisePage.recordsetPage.getFacetOptions(idx).count().then(function(ct) {
                        return ct == customFilterParams.totalNumOptions;
                    });
                }, browser.params.defaultTimeout);

                // wait for list to be fully visible
                browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getList(idx)), browser.params.defaultTimeout);

                /**
                 * NOTE: this used to be getFacetOptions, but for some reason the .getText started returning empty
                 * value for the rows that are hidden because of the height logic
                 * so I changed it to directly get the text from javascript.
                 */
                return chaisePage.recordsetPage.getFacetOptionsText(idx);
            }).then(function (opts) {
                opts.forEach(function (option, i) {
                    expect(option).toEqual(customFilterParams.options[i], `options missmatch, index=${i}`);
                });

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

            chaisePage.clickButton(chaisePage.recordsetPage.getClearCustomFilters()).then(function () {
                chaisePage.waitForElementInverse(element(by.id("spinner")));
                browser.wait(function () {
                    return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                        return ct == customFilterParams.numRowsWOFilter;
                    });
                }, browser.params.defaultTimeout);

                expect(chaisePage.recordsetPage.getRows().count()).toEqual(customFilterParams.numRowsWOFilter, "total row count missmatch.");

                browser.wait(function () {
                    return chaisePage.recordsetPage.getFacetOptions(idx).count().then(function(ct) {
                        return ct == customFilterParams.optionsWOFilter.length;
                    });
                }, browser.params.defaultTimeout);

                /**
                 * NOTE: this used to be getFacetOptions, but for some reason the .getText started returning empty
                 * value for the rows that are hidden because of the height logic
                 * so I changed it to directly get the text from javascript.
                 */
                return chaisePage.recordsetPage.getFacetOptionsText(idx);
            }).then(function (opts) {
                opts.forEach(function (option, i) {
                    expect(option).toEqual(customFilterParams.optionsWOFilter[i], `options missmatch, index=${i}`);
                });

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
        var facet = chaisePage.recordsetPage.getFacetHeaderButtonById(idx);

        var checkAlert = function (al) {
            browser.wait(EC.visibilityOf(al, browser.params.defaultTimeout));
            expect(al.getText()).toContain("WarningMaximum URL length reached. Cannot perform the requested action.", "alert message missmatch.");
        };

        beforeAll(function (done) {
            chaisePage.navigate(uri);
            chaisePage.waitForElementInverse(element(by.id("spinner")));

            clearAll = chaisePage.recordsetPage.getClearAllFilters();
            browser.wait(EC.elementToBeClickable(clearAll));

            //close the first facet
            chaisePage.recordsetPage.getFacetHeaderButtonById(0).click().then(function () {
                //close the second facet
                return chaisePage.clickButton(chaisePage.recordsetPage.getFacetHeaderButtonById(1));
            }).then(function () {
                return clearAll.click();
            }).then(function () {
                chaisePage.waitForElementInverse(element(by.id("spinner")));

                done();
            }).catch(chaisePage.catchTestError(done));
        });

        it ("searching a lenghty string should show the `Maximum URL length reached` warning.", function () {
            var mainSearch = chaisePage.recordsetPage.getMainSearchInput();
            mainSearch.sendKeys(chance.string({length: 4000}));
            chaisePage.recordsetPage.waitForInverseMainSpinner();
            expect(chaisePage.recordsetPage.getRows().count()).toBe(testParams.maximumLength.numRows, "row count missmatch.");
            checkAlert(alert);
        });

        /**
         * The following test only works for ermrest installation that have
         * `quantified_value_lists` feature.
         */
        describe("in facet modal, ", function () {
            var modalAlert = chaisePage.recordsetPage.getModalWarningAlert(chaisePage.searchPopup.getFacetPopup());
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
                expect(modalAlert.isPresent()).toBeFalsy();
            });

            it ("alert should be displayed upon reaching the URL limit and submit button should be disabled.", function (done) {
                browser.wait(function () {
                    return chaisePage.recordsetPage.getModalRows().count().then(function (ct) {
                        return (ct == 25);
                    });
                });

                chaisePage.clickButton(chaisePage.recordsetPage.getSelectAllBtn()).then(function () {
                    checkAlert(modalAlert);
                    expect(submitBtn.getAttribute('disabled')).toBe('true', "submit is not disabled.");
                    done();
                }).catch(chaisePage.catchTestError(done));
            });

            it ("changing filters and going below the URL limit should hide the alert and enable the submit button.", function (done) {
                chaisePage.clickButton(chaisePage.recordsetPage.getModalRecordsetTableOptionByIndex(chaisePage.searchPopup.getFacetPopup(), 0)).then(function () {
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

        /**
         * The following test only works for ermrest installation that have
         * `quantified_value_lists` feature.
         */
        describe("in main container, ", function () {
            var secondFacetIdx = testParams.maximumLength.secondFacetIdx;

            it ("alert should be displayed upon reaching the URL limit and the request should not be completed.", function (done) {
                var secondFacet = chaisePage.recordsetPage.getFacetHeaderButtonById(secondFacetIdx);

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

                    return secondFacetOption.click();
                }).then(function () {
                    checkAlert(alert);
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
                chaisePage.navigate(uri);
                chaisePage.waitForElementInverse(element(by.id("spinner")));

                clearAll = chaisePage.recordsetPage.getClearAllFilters();
                browser.wait(EC.elementToBeClickable(clearAll));

                clearAll.click().then(function () {
                    chaisePage.waitForElementInverse(element(by.id("spinner")));

                    done();
                }).catch(chaisePage.catchTestError(done));
            });

            it("clicking edit should show the same number of forms in RE as rows in RS.", function (done) {
                var editLink = chaisePage.recordsetPage.getEditRecordLink();
                browser.wait(EC.elementToBeClickable(editLink));

                editLink.click().then(function() {
                    browser.wait(function() {
                        return chaisePage.recordEditPage.getRecordeditForms().count().then(function(ct) {
                            return (ct == 25);
                        });
                    }, browser.params.defaultTimeout);

                    return chaisePage.recordEditPage.getRecordeditForms().count();
                }).then(function(count) {
                    expect(count).toBe(25);

                    done();
                }).catch(chaisePage.catchTestError(done));
            });
        });

        describe("in recordedit app, foreign key popup should have facets available,", function() {

            var hidePanelBtn, showPanelBtn, sidePanel, modalBody;

            beforeAll(function (done) {
                chaisePage.navigate(uri);

                chaisePage.waitForUrl('facets', browser.params.defaultTimeout);

                browser.getCurrentUrl().then(function (url) {
                    var uri = url.replace("recordset", "recordedit");
                    chaisePage.navigate(uri);

                    chaisePage.recordeditPageReady();

                    done();
                }).catch(chaisePage.catchTestError(done));
            });

            it("should click the foreign key popup button and have the facet collapse button visible in search popup", function (done) {
                expect(chaisePage.recordEditPage.getRecordeditForms().count()).toBe(1, "number of forms shown is incorrect");
                chaisePage.recordEditPage.getModalPopupBtns().then(function(popupBtns) {
                    // open the first fk popup
                    return chaisePage.clickButton(popupBtns[0]);
                }).then(function () {
                    browser.wait(EC.visibilityOf(chaisePage.recordEditPage.getModalTitle()), browser.params.defaultTimeout);

                    browser.wait(function () {
                        return chaisePage.recordsetPage.getModalRows().count().then(function (ct) {
                            return (ct == 13);
                        });
                    });

                    modalBody = element(by.css('.modal-body'));

                    // make sure side bar is hidden
                    sidePanel = chaisePage.recordsetPage.getSidePanel(modalBody);
                    expect(sidePanel.isDisplayed()).toBe(false);

                    // get show filter panel
                    showPanelBtn = chaisePage.recordsetPage.getShowFilterPanelBtn(modalBody);
                    chaisePage.waitForElement(showPanelBtn);
                    done();
                }).catch(chaisePage.catchTestError(done));
            });

            it("clicking the side panel button should open the facet panel", function (done) {
                showPanelBtn.click().then(function () {
                    browser.wait(EC.visibilityOf(sidePanel), browser.params.defaultTimeout);

                    hidePanelBtn = chaisePage.recordsetPage.getHideFilterPanelBtn(modalBody);
                    chaisePage.waitForElement(hidePanelBtn);

                    expect(sidePanel.isDisplayed()).toBeTruthy("Side panel is not visible after opening it");
                    done();
                }).catch(chaisePage.catchTestError(done));
            });

            it("select a facet option and select a row for the input", function (done) {
                chaisePage.clickButton(chaisePage.recordsetPage.getFacetOption(0, 0)).then(function () {
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
                    browser.wait(EC.visibilityOf(chaisePage.recordEditPage.getEntityTitleElement()), browser.params.defaultTimeout);

                    var foreignKeyInputDisplay = chaisePage.recordEditPage.getForeignKeyInputDisplay("fk_to_f1", 0);
                    expect(foreignKeyInputDisplay.getText()).toEqual("eight", "Didn't select the expected foreign key.");
                    done();
                }).catch(chaisePage.catchTestError(done));
            });
        });

        describe("in record app, association add popup should have facets available,", function() {

            var hidePanelBtn, showPanelBtn, sidePanel, modalBody;

            beforeAll(function (done) {
                chaisePage.navigate(uri);
                chaisePage.waitForUrl('facets', browser.params.defaultTimeout);

                browser.getCurrentUrl().then(function (url) {
                    var uri = url.replace("recordset", "record");
                    chaisePage.navigate(uri);

                    chaisePage.waitForElement(element(by.css('.record-main-section-table')));
                    done();
                }).catch(chaisePage.catchTestError(done));
            })

            it("navigating to record with a facet url", function () {
                recordEditHelpers.testRecordAppValuesAfterSubmission(testParams.recordColumns, testParams.recordValues, testParams.recordColumns.length);
            });

            it("should click the add button for an association table and have the facet collapse button visible", function (done) {
                chaisePage.recordPage.getAddRecordLink(testParams.associationRTName).click().then(function () {
                    browser.wait(EC.visibilityOf(chaisePage.recordEditPage.getModalTitle()), browser.params.defaultTimeout);

                    browser.wait(function () {
                        return chaisePage.recordsetPage.getModalRows().count().then(function (ct) {
                            return (ct == 5);
                        });
                    });

                    modalBody = element(by.css('.modal-body'));

                    // make sure side bar is hidden
                    sidePanel = chaisePage.recordsetPage.getSidePanel(modalBody);
                    expect(sidePanel.isDisplayed()).toBe(false);

                    // get show filter panel
                    showPanelBtn = chaisePage.recordsetPage.getShowFilterPanelBtn(modalBody);
                    chaisePage.waitForElement(showPanelBtn);

                    done();
                }).catch(chaisePage.catchTestError(done));
            });

            it("clicking the side panel button should open the facet panel", function (done) {
                showPanelBtn.click().then(function () {
                    browser.wait(EC.visibilityOf(sidePanel), browser.params.defaultTimeout);

                    hidePanelBtn = chaisePage.recordsetPage.getHideFilterPanelBtn(modalBody);
                    chaisePage.waitForElement(hidePanelBtn);

                    expect(sidePanel.isDisplayed()).toBeTruthy("Side panel is not visible after opening it");
                    done();
                }).catch(chaisePage.catchTestError(done));
            });

            it("select a facet option and select a row to associate", function (done) {
                chaisePage.clickButton(chaisePage.recordsetPage.getFacetOption(0, 0)).then(function () {
                    browser.wait(function () {
                        return chaisePage.recordsetPage.getRecordsetTableModalOptions().count().then(function (ct) {
                            return (ct == 1);
                        });
                    });

                    return chaisePage.recordsetPage.getFacetFilters();
                }).then(function (filters) {
                    expect(filters[0].getText()).toBe(testParams.associationPopupFacetFilter, "Filter for selected rows is incorrect");

                    var rowCheckbox = chaisePage.recordsetPage.getModalRecordsetTableOptionByIndex(chaisePage.searchPopup.getAddPureBinaryPopup(), 0);

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

    describe("navigating to recordset with custom facet.", function () {
        var customFacetParams = testParams.customFacet;
        var idx = customFacetParams.facet;

        beforeAll(function () {
            var uri = browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schema_name + ":" + testParams.table_name;

            uri += "/*::cfacets::" + customFacetParams.cfacetBlob;

            chaisePage.navigate(uri);
            chaisePage.waitForElementInverse(element(by.id("spinner")));
        });

        it ("should show the applied filter and clear all button.", function (done) {
            browser.wait(function () {
                return chaisePage.recordsetPage.getFacetFilters().count().then(function(ct) {
                    return ct == 1;
                });
            }, browser.params.defaultTimeout);

            chaisePage.recordsetPage.getFacetFilters().then(function (filters) {
                expect(filters[0].getText()).toEqual("Custom Filter\n" + customFacetParams.cfacet.displayname, "filter text missmatch.");

                expect(chaisePage.recordsetPage.getClearAllFilters().isDisplayed()).toBeTruthy("`Clear All` is not visible");

                done();
            }).catch(chaisePage.catchTestError(done));
        });

        it ("main and faceting data should be based on the filter, and be able to apply new filters.", function (done) {
            browser.wait(function () {
                return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                    return ct == customFacetParams.numRows;
                });
            }, browser.params.defaultTimeout);
            // main
            expect(chaisePage.recordsetPage.getRows().count()).toEqual(customFacetParams.numRows, "total row count missmatch.");

            chaisePage.clickButton(chaisePage.recordsetPage.getFacetHeaderButtonById(idx)).then(function () {
                browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getFacetCollapse(idx)), browser.params.defaultTimeout);

                // wait for facet checkboxes to load
                browser.wait(function () {
                    return chaisePage.recordsetPage.getFacetOptions(idx).count().then(function(ct) {
                        return ct == customFacetParams.totalNumOptions;
                    });
                }, browser.params.defaultTimeout);

                // wait for list to be fully visible
                browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getList(idx)), browser.params.defaultTimeout);

                /**
                 * NOTE: this used to be getFacetOptions, but for some reason the .getText started returning empty
                 * value for the rows that are hidden because of the height logic
                 * so I changed it to directly get the text from javascript.
                 */
                return chaisePage.recordsetPage.getFacetOptionsText(idx);
            }).then(function (opts) {
                opts.forEach(function (option, i) {
                    expect(option).toEqual(customFacetParams.options[i], `options missmatch, index=${i}`);
                });

                // select a new facet
                return chaisePage.clickButton(chaisePage.recordsetPage.getFacetOption(idx, customFacetParams.option));
            }).then(function () {
                // wait for table rows to load
                browser.wait(function () {
                    return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                        return ct == customFacetParams.numRowsWFacet;
                    });
                }, browser.params.defaultTimeout);

                // make sure data has been updated
                expect(chaisePage.recordsetPage.getRows().count()).toBe(customFacetParams.numRowsWFacet, "");

                // make sure filter is there
                expect(chaisePage.recordsetPage.getFacetFilters().count()).toBe(2, "facet filter missing.");


                done();
            }).catch(chaisePage.catchTestError(done));
        });

        it ("clicking on `x` for Custom Filter should only clear the filter.", function (done) {
            expect(chaisePage.recordsetPage.getClearCustomFacets().isDisplayed()).toBeTruthy("`Clear Custom Facets` is not visible.");

            chaisePage.recordsetPage.getClearCustomFacets().click().then(function () {
                // wait for table rows to load
                browser.wait(function () {
                    return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                        return ct == customFacetParams.numRowsWOCustomFacet;
                    });
                }, browser.params.defaultTimeout);

                expect(chaisePage.recordsetPage.getRows().count()).toEqual(customFacetParams.numRowsWOCustomFacet, "total row count missmatch.");

                // wait for list to be fully visible
                browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getList(idx)), browser.params.defaultTimeout);

                /**
                 * NOTE: this used to be getFacetOptions, but for some reason the .getText started returning empty
                 * value for the rows that are hidden because of the height logic
                 * so I changed it to directly get the text from javascript.
                 */
                return chaisePage.recordsetPage.getFacetOptionsText(idx);
            }).then(function (opts) {
                opts.forEach(function (option, i) {
                    expect(option).toEqual(customFacetParams.optionsWOCustomFacet[i], `options missmatch, index=${i}`);
                });

                done();
            }).catch(chaisePage.catchTestError(done));
        });
    });
});
