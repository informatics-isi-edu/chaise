var chaisePage = require('../../../utils/chaise.page.js');
var recordSetHelpers = require('../../../utils/recordset-helpers.js');
var Q = require('q');
var EC = protractor.ExpectedConditions;
var testParams = {
    schema_name: "faceting",
    table_name: "main",
    sort: "@sort(id)",
    totalNumFacets: 23,
    facetNames: [
        "id", "int_col", "float_col", "date_col", "timestamp_col", "text_col",
        "longtext_col", "markdown_col", "boolean_col", "jsonb_col", "F1",
        "to_name", "f3 (term)", "from_name", "F1 with Term", "Check Presence Text",
        "F3 Entity", "F5", "F5 with filter", "Outbound1 (using F1)",
        "col_w_column_order_false", "col_w_column_order", "col_w_long_values"
    ],
    defaults: {
        openFacetNames: ["id", "int_col", "to_name"],
        numFilters: 2,
        numRows: 1,
        pageSize: 25
    },
    searchBox: {
        term: "one",
        numRows: 6,
        term2: "eve",
        term2Rows: 4,
        term3: "ns",
        term3Rows: 1
    },
    minInputClass: "range-min",
    minInputClearClass: "min-clear",
    maxInputClass: "range-max",
    maxInputClearClass: "max-clear",
    tsMinDateInputClass: "ts-date-range-min",
    tsMinDateInputClearClass: "min-date-clear",
    tsMinTimeInputClass: "ts-time-range-min",
    tsMinTimeInputClearClass: "min-time-clear",
    tsMaxDateInputClass: "ts-date-range-max",
    tsMaxDateInputClearClass: "max-date-clear",
    tsMaxTimeInputClass: "ts-time-range-max",
    tsMaxTimeInputClearClass: "max-time-clear",
    facets: [
        {
            name: "id",
            type: "choice",
            totalNumOptions: 10,
            option: 2,
            filter: "id\n3",
            numRows: 1,
            options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
            comment: "ID comment"
        },
        {
            name: "int_col",
            type: "numeric",
            notNullNumRows: 20,
            listElems: 1,
            invalid: 1.1,
            error: "Please enter a valid integer value.",
            range: {
                min: 5,
                max: 10,
                filter: "int_col\n5 to 10",
                numRows: 6
            },
            justMin: {
                min: 6,
                filter: "int_col\n≥ 6",
                numRows: 17
            },
            justMax: {
                max: 12,
                filter: "int_col\n≤ 12",
                numRows: 15
            },
            comment: "int comment"
        },
        {
            name: "float_col",
            type: "numeric",
            listElems: 0,
            invalid: "1.1.",
            error: "Please enter a valid decimal value.",
            range: {
                min: 6.5,
                max: 12.2,
                filter: "float_col\n6.5000 to 12.2000",
                numRows: 12
            },
            justMin: {
                min: 8.9,
                filter: "float_col\n≥ 8.9000",
                numRows: 14
            },
            justMax: {
                max: 7.45,
                filter: "float_col\n≤ 7.4500",
                numRows: 4
            }
        },
        {
            name: "date_col",
            type: "date",
            listElems: 0,
            invalid: "12-22-20067",
            error: "Please enter a valid date value.",
            range: {
                min: "06-14-2002",
                max: "12-12-2007",
                filter: "date_col\n2002-06-14 to 2007-12-12",
                numRows: 5
            },
            justMin: {
                min: "12-14-2009",
                filter: "date_col\n≥ 2009-12-14",
                numRows: 3
            },
            justMax: {
                max: "04-18-2007",
                filter: "date_col\n≤ 2007-04-18",
                numRows: 14
            }
        },
        {
            name: "timestamp_col",
            type: "timestamp",
            listElems: 0,
            notNullNumRows: 20,
            // invalid removed since mask protects against bad input values, clear date input to test validator
            // invalid: {...}
            error: "Please enter a valid date value.",
            range: {
                minDate: "05-20-2004",
                minTime: "10:08:00",
                maxDate: "12-06-2007",
                maxTime: "17:26:12",
                filter: "timestamp_col\n2004-05-20 10:08:00 to 2007-12-06 17:26:12",
                numRows: 3
            },
            justMin: {
                date: "05-20-2004",
                time: "10:08:00",
                filter: "timestamp_col\n≥ 2004-05-20 10:08:00",
                numRows: 8
            },
            justMax: {
                date: "12-06-2007",
                time: "17:26:12",
                filter: "timestamp_col\n≤ 2007-12-06 17:26:12",
                numRows: 15
            },
            comment: "timestamp column"
        },
        {
            name: "text_col",
            type: "choice",
            totalNumOptions: 12,
            option: 1,
            filter: "text_col\nNo value",
            numRows: 5,
            options: ['All records with value', 'No value', 'one', 'Empty', 'two', 'seven', 'eight', 'elevens', 'four', 'six', 'ten', 'three']
        },
        {
            name: "longtext_col",
            type: "choice",
            totalNumOptions: 10,
            option: 1,
            filter: "longtext_col\ntwo",
            numRows: 5,
            options: ['Empty', 'two', 'one', 'eight', 'eleven', 'five', 'four', 'lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc scelerisque vitae nisl tempus blandit. Nam at tellus sit amet ex consequat euismod. Aenean placerat dui a imperdiet dignissim. Fusce non nulla sed lectus interdum consequat. Praesent vehicula odio ut mauris posuere semper sit amet vitae enim. Vivamus faucibus quam in felis commodo eleifend. Nunc varius sit amet est eget euismod. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc scelerisque vitae nisl tempus blandit. Nam at tellus sit amet ex consequat euismod. Aenean placerat dui a imperdiet dignissim. Fusce non nulla sed lectus interdum consequat. Praesent vehicula odio ut mauris posuere semper sit amet vitae enim. Vivamus faucibus quam in felis commodo eleifend. Nunc varius sit amet est eget euismod. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc scelerisque vitae nisl tempus blandit. Nam at tellus sit amet ex consequat euismod. Aenean placerat dui a imperdiet dignissim. Fusce non nulla sed lectus interdum consequat. Praesent vehicula odio ut mauris posuere semper sit amet vitae enim. Vivamus faucibus quam in felis commodo eleifend. Nunc varius sit amet est eget euismod. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc scelerisque vitae nisl tempus blandit. Nam at tellus sit amet ex consequat euismod. Aenean placerat dui a imperdiet dignissim. Fusce non nulla sed lectus interdum consequat. Praesent vehicula odio ut mauris posuere semper sit amet vitae enim. Vivamus faucibus quam in felis commodo eleifend. Nunc varius sit amet est eget euismod.', 'nine', 'seven'],
            comment: "A lengthy comment for the facet of the longtext_col. This should be displyed properly in the facet."
        },
        {
            name: "markdown_col",
            type: "choice",
            totalNumOptions: 10,
            option: 3,
            filter: "markdown_col\neight",
            numRows: 1,
            options: ['Empty', 'one', 'two', 'eight', 'eleven', 'five', 'four', 'nine', 'seven', 'six']
        },
        {
            name: "boolean_col",
            type: "choice",
            totalNumOptions: 3,
            option: 2,
            filter: "boolean_col\nYes",
            numRows: 10,
            options: ['All records with value', 'No', 'Yes'],
            isBoolean: true
        },
        {
            name: "jsonb_col",
            type: "choice",
            totalNumOptions: 11,
            option: 4,
            filter: 'jsonb_col\n{ "key": "four" }',
            numRows: 1,
            options: ['All records with value', '{ "key": "one" }', '{ "key": "two" }', '{ "key": "three" }', '{ "key": "four" }', '{ "key": "five" }', '{ "key": "six" }', '{ "key": "seven" }', '{ "key": "eight" }', '{ "key": "nine" }', '{ "key": "ten" }']
        },
        {
            name: "F1",
            type: "choice",
            totalNumOptions: 11,
            option: 2,
            filter: "F1\ntwo",
            numRows: 10,
            options: ['No value', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
            isEntityMode: true,
            searchPlaceholder: "term column"
        },
        {
            name: "to_name",
            type: "choice",
            totalNumOptions: 10,
            option: 0,
            filter: "to_name\none",
            numRows: 10,
            options: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
            comment: "open facet",
            isEntityMode: true
        },
        {
            name: "f3 (term)",
            type: "choice",
            totalNumOptions: 3,
            option: 1,
            filter: "f3 (term)\none",
            numRows: 6,
            options: ['All records with value', 'one', 'two']
        },
        {
            name: "from_name",
            type: "choice",
            totalNumOptions: 11,
            option: 5,
            filter: "from_name\n5",
            numRows: 1,
            options: ['All records with value', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
        },
        {
            name: "F1 with Term",
            type: "choice",
            totalNumOptions: 10,
            option: 1,
            filter: "F1 with Term\ntwo",
            numRows: 10,
            options: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
            comment: "F1 with Term comment",
            isEntityMode: true,
            searchPlaceholder: "term column"
        },
        {
            name: "Check Presence Text",
            type: "check_presence",
            notNullNumRows: 9,
            notNullFilter: "Check Presence Text\nAll records with value",
            nullNumRows: 21,
            nullFilter: "Check Presence Text\nNo value"
        },
        {
            name: "F3 Entity",
            type: "choice",
            totalNumOptions: 4,
            option: 1,
            filter: "F3 Entity\nNo value",
            numRows: 23,
            options: ['All records with value', 'No value', 'one', 'two'],
            isEntityMode: true
        },
        {
            name: "F5",
            type: "choice",
            totalNumOptions: 4,
            option: 2,
            filter: "F5\none",
            numRows: 1,
            options: ["All records with value", "No value", "one", "two"],
            isEntityMode: true
        },
        {
            name: "F5 with filter",
            type: "choice",
            totalNumOptions: 2,
            option: 1,
            filter: "F5 with filter\ntwo",
            numRows: 1,
            comment: "has filters",
            options: ["All records with value", "two"],
            isEntityMode: true
        },
        {
            name: "Outbound1 (using F1)",
            type: "choice",
            totalNumOptions: 10,
            option: 2,
            filter: "Outbound1 (using F1)\nfour (o1)",
            numRows: 1,
            options: ['one (o1)', 'three (o1)', 'four (o1)', 'six (o1)', 'seven (o1)', 'eight (o1)', 'nine (o1)', 'ten (o1)', 'eleven (o1)', 'twelve (o1)'],
            isEntityMode: true,
            comment: "is using another facet sourcekey in source"
        },
        {
            name: "col_w_column_order_false",
            type: "choice",
            totalNumOptions: 8,
            option: 1,
            filter: "col_w_column_order_false\n01",
            numRows: 9,
            options: ['All records with value', '01', '02', '03', '04', '05', '06', '07']
        }
    ],
    multipleFacets: [
        { facetIdx: 10, option: 2, numOptions: 11, numRows: 10 },
        { facetIdx: 11, option: 0, numOptions: 2, numRows: 5 },
        { facetIdx: 12, option: 1, numOptions: 2, numRows: 5 },
        { facetIdx: 13, option: 2, numOptions: 6, numRows: 1 }
    ]
};

describe("Viewing Recordset with Faceting,", function () {

    describe("For table " + testParams.table_name + ",", function () {

        var table, record,
            uri = browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schema_name + ":" + testParams.table_name + testParams.sort;

        beforeAll(function () {
            chaisePage.navigate(uri);
            chaisePage.waitForElementInverse(element(by.id("spinner")));
            chaisePage.recordsetPageReady();
        });

        describe("default presentation based on facets annotation ", function () {
            it("should have " + testParams.totalNumFacets + " facets", function (done) {
                browser.wait(function () {
                    return chaisePage.recordsetPage.getAllFacets().count().then(function (ct) {
                        return (ct == testParams.totalNumFacets);
                    });
                }, browser.params.defaultTimeout);

                chaisePage.recordsetPage.getFacetTitles().then(function (titles) {
                    titles.forEach(function (title, idx) {
                        expect(title.getText()).toEqual(testParams.facetNames[idx], "All facets' names is incorrect");
                    });
                    done();
                }).catch(chaisePage.catchTestError(done));

            });

            it("verify the text is truncated properly based on the 'maxRecordsetRowHeight=100', then not truncated after clicking 'more'", function (done) {
                // default config: maxRecordsetRowHeight = 100
                // 100 for max height, 10 for padding, 1 for border
                var testCell, cellHeight = 110;
                chaisePage.recordsetPage.getRows().then(function (rows) {
                    return chaisePage.recordsetPage.getRowCells(rows[0]);
                }).then(function (cells) {
                    testCell = cells[2];
                    expect(testCell.getText()).toContain("... more");

                    return testCell.getSize();
                }).then(function (dimensions) {
                    expect(dimensions.height).toBe(cellHeight);

                    return testCell.element(by.css(".readmore")).click();
                }).then(function () {
                    expect(testCell.getText()).toContain("... less");

                    return testCell.getSize();
                }).then(function (tallerDimensions) {
                    expect(tallerDimensions.height).toBeGreaterThan(cellHeight);
                    done();
                }).catch(chaisePage.catchTestError(done));
            });

            it("should have 3 facets open", function (done) {
                chaisePage.recordsetPage.getOpenFacets().count().then(function (ct) {
                    expect(ct).toBe(testParams.defaults.openFacetNames.length, "Number of open facets is incorrect");

                    return chaisePage.recordsetPage.getOpenFacetTitles();
                }).then(function (titles) {
                    titles.forEach(function (title, idx) {
                        expect(title.getText()).toEqual(testParams.defaults.openFacetNames[idx], "Names of open facets are incorrect");
                    });
                    done();
                }).catch(chaisePage.catchTestError(done));
            });

            // test defaults and values shown
            it("'id' facet should have 1 row checked", function (done) {
                // use 0 index
                chaisePage.recordsetPage.getCheckedFacetOptions(0).count().then(function (ct) {
                    expect(ct).toBe(1);
                    done();
                }).catch(chaisePage.catchTestError(done));
            });

            it("'int_col' facet should not show the histogram", function () {
                // use 1 index
                browser.wait(EC.not(EC.visibilityOf(chaisePage.recordsetPage.getHistogram(1)))).then(function () {
                    expect(true).toBeTruthy("The histogram is displayed");
                });
            });

            it("should have 2 filters selected", function (done) {
                chaisePage.recordsetPage.getFacetFilters().count().then(function (ct) {
                    expect(ct).toBe(testParams.defaults.numFilters, "Number of visible filters is incorrect");
                    done();
                }).catch(chaisePage.catchTestError(done));
            });

            it("should have 1 row visible", function (done) {
                chaisePage.recordsetPage.getRows().count().then(function (ct) {
                    expect(ct).toBe(testParams.defaults.numRows, "Number of visible rows is incorrect");
                    done();
                }).catch(chaisePage.catchTestError(done));
            });

            it("should have 1 row selected in show more popup for scalar picker and should be able to search in popup.", function (done) {
                var showMore = chaisePage.recordsetPage.getShowMore(0);

                // open show more, verify only 1 row checked, check another and submit
                showMore.click().then(function () {
                    // one row is selected
                    browser.wait(function () {
                        return chaisePage.recordsetPage.getCheckedModalOptions().count().then(function (ct) {
                            return ct == 1;
                        });
                    }, browser.params.defaultTimeout, "waiting for one row to be selected");

                    // search
                    var facetPopup = chaisePage.searchPopup.getScalarPopup();
                    var searchInp = chaisePage.recordsetPage.getMainSearchInput(facetPopup),
                        searchSubmitBtn = chaisePage.recordsetPage.getSearchSubmitButton(facetPopup);

                    searchInp.sendKeys("1|2");
                    return searchSubmitBtn.click();
                }).then(function () {
                    // make sure search result is displayed
                    browser.wait(function () {
                        return chaisePage.recordsetPage.getModalOptions().count().then(function (ct) {
                            return ct == 13;
                        });
                    }, browser.params.defaultTimeout, "waiting for rows after search");

                    return chaisePage.recordsetPage.getModalOptions();
                }).then(function (options) {
                    // make sure the first row is selected
                    expect(options[0].isSelected()).toBeTruthy("the first option was not selected");
                    options.forEach(function (op, i) {
                        if (i === 0) return;
                        expect(op.isSelected()).toBeFalsy("option index=" + i + " was selected.");
                    });

                    // click the 2nd option
                    return chaisePage.clickButton(options[1]);
                }).then(function () {
                    return chaisePage.recordsetPage.getModalSubmit().click();
                }).then(function () {

                    browser.wait(function () {
                        return chaisePage.recordsetPage.getCheckedFacetOptions(0).count().then(function (ct) {
                            return ct == 2;
                        });
                    }, browser.params.defaultTimeout, "waiting for checked facet options in recordset");

                    return chaisePage.recordsetPage.getCheckedFacetOptions(0).count();
                }).then(function (ct) {
                    expect(ct).toBe(2, "Number of facet options is incorrect after returning from modal");

                    // make sure the number of rows is correct
                    browser.wait(function () {
                        return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                            return ct == 2;
                        });
                    }, browser.params.defaultTimeout, "Number of rows for search input is incorrect");

                    // search string too
                    chaisePage.recordsetPage.getFacetSearchBox(0).sendKeys(11);

                    browser.wait(function () {
                        return chaisePage.recordsetPage.getFacetOptions(0).count().then(function (ct) {
                            return ct == 3;
                        });
                    }, browser.params.defaultTimeout);

                    return chaisePage.recordsetPage.getFacetOptions(0).count();
                }).then(function (ct) {
                    expect(ct).toBe(3, "Facet values after search are incorrect");

                    return chaisePage.recordsetPage.getFacetSearchBoxClear(0).click();
                }).then(function () {
                    done();
                }).catch(chaisePage.catchTestError(done));
            });

            it("boolean facet should not have a search box present", function (done) {
                // idx 8 is for boolean facet
                var booleanFacet = chaisePage.recordsetPage.getFacetHeaderButtonById(8);

                booleanFacet.click().then(function () {
                    browser.wait(EC.not(EC.presenceOf(chaisePage.recordsetPage.getFacetSearchBox(8))), browser.params.defaultTimeout);

                    return booleanFacet.click();
                }).then(function () {
                    expect(true).toBeTruthy();
                    done();
                }).catch(chaisePage.catchTestError(done));
            });

            it("main search box should show the search columns.", function () {
                expect(chaisePage.recordsetPage.getMainSearchPlaceholder().getText()).toBe("Search text, long column");
            });

            it("search using the global search box should search automatically, show the search phrase as a filter, and show the set of results", function (done) {
                var mainSearch = chaisePage.recordsetPage.getMainSearchInput();

                chaisePage.recordsetPage.getClearAllFilters().click().then(function () {
                    return chaisePage.waitForElementInverse(element(by.id("spinner")));
                }).then(function () {
                    mainSearch.sendKeys(testParams.searchBox.term);

                    // make sure the number of rows is correct
                    browser.wait(function () {
                        return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                            return ct == testParams.searchBox.numRows;
                        });
                    }, browser.params.defaultTimeout, "Number of rows for search input is incorrect");

                    return chaisePage.recordsetPage.getSearchClearButton().click();
                }).then(function () {
                    // make sure the number of rows is correct
                    browser.wait(function () {
                        return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                            return ct == testParams.defaults.pageSize;
                        });
                    }, browser.params.defaultTimeout, "Number of rows after clearing search input via search clear button");

                    return mainSearch.getText();
                }).then(function (text) {
                    expect(text).toBe("", "Main search did not clear properly after clicking the remove search button in the search input");

                    mainSearch.sendKeys(testParams.searchBox.term2);
                    browser.wait(function () {
                        return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                            return ct == testParams.searchBox.term2Rows;
                        });
                    }, browser.params.defaultTimeout, "number of rows for search term 2 missmatch.");

                    mainSearch.sendKeys(testParams.searchBox.term3);
                    browser.wait(function () {
                        return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                            return ct == testParams.searchBox.term3Rows;
                        });
                    }, browser.params.defaultTimeout, "number of rows for search term 3 missmatch.");

                    return chaisePage.recordsetPage.getSearchClearButton().click();
                }).then(function () {
                    browser.wait(function () {
                        return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                            return ct == testParams.defaults.pageSize;
                        });
                    }, browser.params.defaultTimeout, "Number of rows after clearing search input via search clear button (the last wait in test)");

                    done();
                }).catch(chaisePage.catchTestError(done));
            });

            it("should have 1 row selected in show more popup for entity.", function (done) {
                var showMore = chaisePage.recordsetPage.getShowMore(11);

                chaisePage.clickButton(chaisePage.recordsetPage.getFacetOption(11, 0)).then(function () {
                    // open show more, verify only 1 row checked, check another and submit
                    return chaisePage.clickButton(showMore);
                }).then(function () {
                    browser.wait(function () {
                        return chaisePage.recordsetPage.getCheckedModalOptions().count().then(function (ct) {
                            return ct == 1;
                        });
                    }, browser.params.defaultTimeout);

                    return chaisePage.recordsetPage.getModalOptions();
                }).then(function (options) {
                    // click the 2nd option
                    return chaisePage.clickButton(options[1]);
                }).then(function () {
                    return chaisePage.recordsetPage.getModalSubmit().click();
                }).then(function () {
                    browser.wait(function () {
                        return chaisePage.recordsetPage.getCheckedFacetOptions(11).count().then(function (ct) {
                            return ct == 2;
                        });
                    }, browser.params.defaultTimeout);

                    return chaisePage.recordsetPage.getCheckedFacetOptions(11).count();
                }).then(function (ct) {
                    expect(ct).toBe(2, "Number of facet options is incorrect after returning from modal");

                    browser.wait(function () {
                        return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                            return ct == 15;
                        });
                    }, browser.params.defaultTimeout, "Number of visible rows after selecting a second option from the modal is incorrect");

                    return chaisePage.clickButton(chaisePage.recordsetPage.getClearAllFilters());
                }).then(function () {
                    done();
                }).catch(function (err) {
                    done.fail(err);
                });
            });

            if (process.env.CI) {
                it("should show correct tooltip for the facets.", function (done) {
                    var testFacettooltip = function (idx) {

                        // if we reached the end of the list, then finish the test case
                        if (idx == testParams.facets.length) {
                            done();
                            return;
                        }

                        var facetParams = testParams.facets[idx];

                        // if the facet doesn't have any comment, go to the next
                        if (!facetParams.comment) {
                            testFacettooltip(idx + 1);
                            return;
                        }

                        var facetHeader = chaisePage.recordsetPage.getFacetHeaderById(idx);
                        var tooltip = chaisePage.getTooltipDiv();

                        // move mouse over the facet header to show the tooltip (it will scroll too)
                        browser.actions().mouseMove(facetHeader).perform();

                        // wait for the tooltip to show up
                        chaisePage.waitForElement(tooltip).then(function () {
                            expect(tooltip.getText()).toContain(facetParams.comment, "comment missmatch for facet index=" + idx);

                            // move mouse to somewhere that doesn't have tooltip just to clear the tooltip from page
                            browser.actions().mouseMove(chaisePage.recordsetPage.getTotalCount()).perform();
                            chaisePage.waitForElementInverse(tooltip);

                            // test the next facet
                            testFacettooltip(idx + 1);
                        }).catch(function (err) {
                            done.fail(err);
                        });
                    }

                    // go one by one over facets and test their tooltip
                    testFacettooltip(0);
                });
            }

            // facets 12 (idx = 11), 2, and 1 are open by default when the page loads
            //   - 1 and 2 have values preselected in them
            //   - 12 has open:true in the visible-columns annotaiton under the filter context
            afterAll(function closeDefaultOpenFacets() {
                // close the facets in opposite order so they dont move when trying to click others
                chaisePage.clickButton(chaisePage.recordsetPage.getFacetHeaderButtonById(11)).then(function () {
                    browser.wait(function () {
                        return chaisePage.recordsetPage.getClosedFacets().count().then(function (ct) {
                            return ct == testParams.totalNumFacets - 2;
                        });
                    }, browser.params.defaultTimeout)

                    return chaisePage.clickButton(chaisePage.recordsetPage.getFacetHeaderButtonById(1));
                }).then(function () {
                    browser.wait(function () {
                        return chaisePage.recordsetPage.getClosedFacets().count().then(function (ct) {
                            return ct == testParams.totalNumFacets - 1;
                        });
                    }, browser.params.defaultTimeout)

                    return chaisePage.clickButton(chaisePage.recordsetPage.getFacetHeaderButtonById(0));
                }).catch(function (err) {
                    console.dir(err);
                });
            });
        });

        describe("selecting individual filters for each facet type", function () {

            var clearAll;

            beforeAll(function () {
                clearAll = chaisePage.recordsetPage.getClearAllFilters();
            });

            for (var j = 0; j < testParams.facets.length; j++) {
                // anon function to capture looping variable
                (function (facetParams, idx) {
                    if (facetParams.type == "choice") {
                        // tests for choice facets
                        describe("for choice facet: " + facetParams.name + ",", function () {
                            it("should open the facet, select a value to filter on, and update the search criteria.", function () {
                                browser.wait(function () {
                                    return chaisePage.recordsetPage.getClosedFacets().count().then(function (ct) {
                                        return ct == testParams.totalNumFacets;
                                    });
                                }, browser.params.defaultTimeout).then(function () {
                                    // open facet
                                    return chaisePage.recordsetPage.getFacetHeaderButtonById(idx).click();
                                }).then(function () {
                                    // wait for facet to open
                                    browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getFacetCollapse(idx)), browser.params.defaultTimeout);


                                    if (!facetParams.isBoolean) {
                                        // make sure search placeholder is correct
                                        var placeholder = "Search";
                                        if (facetParams.searchPlaceholder) {
                                            placeholder += " " + facetParams.searchPlaceholder;
                                        } else if (facetParams.isEntityMode) {
                                            placeholder += " all columns";
                                        }
                                        expect(chaisePage.recordsetPage.getFacetSearchPlaceholderById(idx).getText()).toBe(placeholder, "invalid placeholder for facet index=" + idx);
                                    }

                                    // wait for facet checkboxes to load
                                    browser.wait(function () {
                                        return chaisePage.recordsetPage.getFacetOptions(idx).count().then(function (ct) {
                                            return ct == facetParams.totalNumOptions;
                                        });
                                    }, browser.params.defaultTimeout);

                                    // wait for list to be fully visible
                                    browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getList(idx)), browser.params.defaultTimeout);

                                    return chaisePage.recordsetPage.getFacetOptions(idx);
                                }).then(function (opts) {
                                    opts.forEach(function (option, idx) {
                                        expect(option.getText()).toEqual(facetParams.options[idx], "facet options are incorrect for '" + facetParams.name + "' facet");
                                    });

                                    return chaisePage.clickButton(chaisePage.recordsetPage.getFacetOption(idx, facetParams.option));
                                }).then(function () {
                                    // wait for request to return
                                    browser.wait(EC.visibilityOf(clearAll), browser.params.defaultTimeout);

                                    // wait for filters to load
                                    browser.wait(function () {
                                        return chaisePage.recordsetPage.getFacetFilters().count().then(function (ct) {
                                            return ct == 1;
                                        });
                                    }, browser.params.defaultTimeout);

                                    return chaisePage.recordsetPage.getFacetFilters().count();
                                }).then(function (ct) {
                                    expect(ct).toBe(1, "number of filters is incorrect for '" + facetParams.name + "' facet");

                                    //should only be one
                                    return chaisePage.recordsetPage.getFacetFilters();
                                }).then(function (filters) {
                                    return filters[0].getText();
                                }).then(function (text) {
                                    expect(text).toBe(facetParams.filter, "filter name is incorrect for '" + facetParams.name + "' facet");

                                    // wait for table rows to load
                                    browser.wait(function () {
                                        return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                                            return ct == facetParams.numRows;
                                        });
                                    }, browser.params.defaultTimeout);

                                    return chaisePage.recordsetPage.getRows().count();
                                }).then(function (ct) {
                                    expect(ct).toBe(facetParams.numRows, "number of rows is incorrect for '" + facetParams.name + "' facet");

                                    return clearAll.click();
                                }).then(function () {
                                    browser.wait(EC.not(EC.visibilityOf(clearAll)), browser.params.defaultTimeout);
                                    // close the facet
                                    return chaisePage.recordsetPage.getFacetHeaderButtonById(idx).click();
                                }).catch(function (exc) {
                                    console.dir(exc);
                                });
                            });
                        });
                    } else if (facetParams.type == "numeric" || facetParams.type == "date") {
                        describe("for range facet: " + facetParams.name + ",", function () {
                            var minInput, maxInput, minClear, maxClear;

                            beforeAll(function () {
                                // inputs
                                minInput = chaisePage.recordsetPage.getRangeMinInput(idx, testParams.minInputClass);
                                maxInput = chaisePage.recordsetPage.getRangeMaxInput(idx, testParams.maxInputClass);
                                // clear buttons
                                minClear = chaisePage.recordsetPage.getInputClear(idx, testParams.minInputClearClass);
                                maxClear = chaisePage.recordsetPage.getInputClear(idx, testParams.maxInputClearClass);
                            });

                            it("should open the facet, test validators, filter on a range, and update the search criteria.", function (done) {
                                // open facet
                                browser.wait(function () {
                                    return chaisePage.recordsetPage.getClosedFacets().count().then(function (ct) {
                                        return ct == testParams.totalNumFacets;
                                    });
                                }, browser.params.defaultTimeout).then(function () {
                                    return chaisePage.recordsetPage.getFacetHeaderButtonById(idx).click();
                                }).then(function (facet) {
                                    // wait for facet to open
                                    browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getFacetCollapse(idx)), browser.params.defaultTimeout);
                                    browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getRangeSubmit(idx)), browser.params.defaultTimeout);

                                    return chaisePage.recordsetPage.getFacetOptions(idx).count();
                                }).then(function (ct) {
                                    expect(ct).toBe(facetParams.listElems + 1, "There are more list elements for '" + facetParams.name + "' facet than expected");

                                    // TODO skipping validation as the browser date doesn't allow this sort of tests
                                    if (facetParams.type == "date") {
                                      return true;
                                    }

                                    minInput.sendKeys(facetParams.invalid);

                                    browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getRangeInputValidationError(idx)), browser.params.defaultTimeout);

                                    return chaisePage.recordsetPage.getRangeInputValidationError(idx).getText();
                                }).then(function (text) {
                                    // TODO skipping validation as the browser date doesn't allow this sort of tests
                                    if (facetParams.type !== "date") {
                                        expect(text).toBe(facetParams.error, "Validation error for '" + facetParams.name + "' did not show up or the message is incorrect");
                                    }

                                    return minClear.click();
                                }).then(function () {
                                    return chaisePage.clickButton(maxClear);
                                }).then(function () {
                                    // test min and max being set
                                    // define test params values
                                    minInput.sendKeys(facetParams.range.min);
                                    maxInput.sendKeys(facetParams.range.max);

                                    // let validation message disappear
                                    browser.sleep(10);

                                    return chaisePage.recordsetPage.getRangeSubmit(idx).click();
                                }).then(function () {
                                    // wait for request to return
                                    browser.wait(EC.visibilityOf(clearAll), browser.params.defaultTimeout);

                                    // wait for facet filters to load
                                    browser.wait(function () {
                                        return chaisePage.recordsetPage.getFacetFilters().count().then(function (ct) {
                                            return ct == 1;
                                        });
                                    }, browser.params.defaultTimeout);

                                    return chaisePage.recordsetPage.getFacetFilters().count();
                                }).then(function (ct) {
                                    expect(ct).toBe(1, "number of filters is incorrect for '" + facetParams.name + "' facet");

                                    //should only be one
                                    return chaisePage.recordsetPage.getFacetFilters();
                                }).then(function (filters) {
                                    return filters[0].getText();
                                }).then(function (text) {
                                    expect(text).toBe(facetParams.range.filter, "filter name is incorrect for '" + facetParams.name + "' facet");

                                    // wait for table rows to load
                                    browser.wait(function () {
                                        return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                                            return ct == facetParams.range.numRows;
                                        });
                                    }, browser.params.defaultTimeout);

                                    return chaisePage.recordsetPage.getRows().count();
                                }).then(function (ct) {
                                    expect(ct).toBe(facetParams.range.numRows, "number of rows is incorrect for '" + facetParams.name + "' facet");

                                    return clearAll.click();
                                }).then(function () {
                                    browser.wait(EC.not(EC.visibilityOf(clearAll)), browser.params.defaultTimeout);

                                    return minClear.click();
                                }).then(function () {
                                    return chaisePage.clickButton(maxClear);
                                }).then(function () {
                                    done();
                                }).catch(chaisePage.catchTestError(done));
                            });

                            if (facetParams.notNullNumRows) {
                                it("should be able to filter not-null values.", function (done) {
                                    var notNulloption = chaisePage.recordsetPage.getFacetOption(idx, 0);
                                    chaisePage.clickButton(notNulloption).then(function () {
                                        // wait for table rows to load
                                        browser.wait(function () {
                                            return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                                                return ct == facetParams.notNullNumRows;
                                            });
                                        }, browser.params.defaultTimeout);

                                        return chaisePage.recordsetPage.getRows().count();
                                    }).then(function (ct) {
                                        expect(ct).toBe(facetParams.notNullNumRows, "number of rows (for not-null) is incorrect for '" + facetParams.name + "' facet");
                                        expect(chaisePage.recordsetPage.getRangeSubmit(idx).getAttribute('disabled')).toEqual('true', "submit btn enabled after selecting not-null for '" + facetParams.name + "' facet");

                                        return clearAll.click();
                                    }).then(function () {
                                        browser.wait(EC.not(EC.visibilityOf(clearAll)), browser.params.defaultTimeout);

                                        // make sure all checkboxes are cleared
                                        browser.wait(
                                            EC.not(EC.visibilityOf(chaisePage.recordsetPage.getCheckedFacetOptions(idx))),
                                            browser.params.defaultTimeout,
                                            "clear-all didn't clear checkboxes"
                                        );
                                        done();
                                    }).catch(chaisePage.catchTestError(done));
                                });
                            }

                            it("should filter on just a min value and update the search criteria.", function (done) {
                                var minInput = chaisePage.recordsetPage.getRangeMinInput(idx, testParams.minInputClass),
                                    minClear = chaisePage.recordsetPage.getInputClear(idx, testParams.minInputClearClass);

                                // test just min being set
                                minInput.sendKeys(facetParams.justMin.min);

                                // let validation message disappear
                                browser.sleep(20);

                                chaisePage.recordsetPage.getRangeSubmit(idx).click().then(function () {
                                    // wait for request to return
                                    browser.wait(EC.visibilityOf(clearAll), browser.params.defaultTimeout);

                                    // wait for facet filters to load
                                    browser.wait(function () {
                                        return chaisePage.recordsetPage.getFacetFilters().count().then(function (ct) {
                                            return ct == 1;
                                        });
                                    }, browser.params.defaultTimeout);

                                    // should only be one
                                    return chaisePage.recordsetPage.getFacetFilters();
                                }).then(function (filters) {
                                    return filters[0].getText();
                                }).then(function (text) {
                                    expect(text).toBe(facetParams.justMin.filter, "filter name is incorrect for '" + facetParams.name + "' facet with just min value");

                                    // wait for table rows to load
                                    browser.wait(function () {
                                        return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                                            return ct == facetParams.justMin.numRows;
                                        });
                                    }, browser.params.defaultTimeout);

                                    return chaisePage.recordsetPage.getRows().count();
                                }).then(function (ct) {
                                    expect(ct).toBe(facetParams.justMin.numRows, "number of rows is incorrect for '" + facetParams.name + "' facet with just min value");

                                    return clearAll.click();
                                }).then(function () {
                                    browser.wait(EC.not(EC.visibilityOf(clearAll)), browser.params.defaultTimeout);

                                    return minClear.click();
                                }).then(function () {
                                    done();
                                }).catch(chaisePage.catchTestError(done));
                            });

                            it("should filter on just a max value and update the search criteria.", function (done) {
                                var maxInput = chaisePage.recordsetPage.getRangeMaxInput(idx, testParams.maxInputClass),
                                    maxClear = chaisePage.recordsetPage.getInputClear(idx, testParams.maxInputClearClass);

                                // test just max being set
                                maxInput.sendKeys(facetParams.justMax.max);

                                // let validation message disappear
                                browser.sleep(20);

                                chaisePage.recordsetPage.getRangeSubmit(idx).click().then(function () {
                                    // wait for request to return
                                    browser.wait(EC.visibilityOf(clearAll), browser.params.defaultTimeout);

                                    // wait for facet filters to load
                                    browser.wait(function () {
                                        return chaisePage.recordsetPage.getFacetFilters().count().then(function (ct) {
                                            return ct == 1;
                                        });
                                    }, browser.params.defaultTimeout);

                                    // should only be one
                                    return chaisePage.recordsetPage.getFacetFilters();
                                }).then(function (filters) {
                                    return filters[0].getText();
                                }).then(function (text) {
                                    expect(text).toBe(facetParams.justMax.filter, "filter name is incorrect for '" + facetParams.name + "' facet with just min value");

                                    // wait for table rows to load
                                    browser.wait(function () {
                                        return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                                            return ct == facetParams.justMax.numRows;
                                        });
                                    }, browser.params.defaultTimeout);

                                    return chaisePage.recordsetPage.getRows().count();
                                }).then(function (ct) {
                                    expect(ct).toBe(facetParams.justMax.numRows, "number of rows is incorrect for '" + facetParams.name + "' facet with just min value");

                                    return clearAll.click();
                                }).then(function () {
                                    browser.wait(EC.not(EC.visibilityOf(clearAll)), browser.params.defaultTimeout);
                                    done();
                                }).catch(chaisePage.catchTestError(done));
                            });

                            it("should close the facet.", function (done) {
                                chaisePage.recordsetPage.getFacetHeaderButtonById(idx).click().then(function () {
                                    done();
                                }).catch(chaisePage.catchTestError(done));
                            })
                        });

                    } else if (facetParams.type == "timestamp") {
                        describe("for range facet: " + facetParams.name + ",", function () {
                            var minDateInput, minTimeInput, maxDateInput, maxTimeInput,
                                minDateClear, minTimeClear, maxDateClear, maxTimeClear;

                            beforeAll(function () {
                                // inputs
                                minDateInput = chaisePage.recordsetPage.getRangeMinInput(idx, testParams.tsMinDateInputClass);
                                minTimeInput = chaisePage.recordsetPage.getRangeMinInput(idx, testParams.tsMinTimeInputClass);
                                maxDateInput = chaisePage.recordsetPage.getRangeMaxInput(idx, testParams.tsMaxDateInputClass);
                                maxTimeInput = chaisePage.recordsetPage.getRangeMaxInput(idx, testParams.tsMaxTimeInputClass);
                                // clear buttons
                                minDateClear = chaisePage.recordsetPage.getInputClear(idx, testParams.tsMinDateInputClearClass);
                                minTimeClear = chaisePage.recordsetPage.getInputClear(idx, testParams.tsMinTimeInputClearClass);
                                maxDateClear = chaisePage.recordsetPage.getInputClear(idx, testParams.tsMaxDateInputClearClass);
                                maxTimeClear = chaisePage.recordsetPage.getInputClear(idx, testParams.tsMaxTimeInputClearClass);
                            });

                            it("should open the facet, test validators, filter on a range, and update the search criteria.", function () {
                                browser.wait(function () {
                                    return chaisePage.recordsetPage.getClosedFacets().count().then(function (ct) {
                                        return ct == testParams.totalNumFacets;
                                    });
                                }, browser.params.defaultTimeout).then(function () {
                                    // open facet
                                    return chaisePage.recordsetPage.getFacetHeaderButtonById(idx).click();
                                }).then(function (facet) {
                                    // wait for facet to open
                                    browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getFacetCollapse(idx)), browser.params.defaultTimeout);
                                    browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getRangeSubmit(idx)), browser.params.defaultTimeout);

                                    return chaisePage.recordsetPage.getFacetOptions(idx).count();
                                }).then(function (ct) {
                                    expect(ct).toBe(facetParams.listElems + 1, "There are more list elements for '" + facetParams.name + "' facet than expected");

                                    // test validator
                                    return minDateClear.click();
                                }).then(function () {
                                    browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getRangeInputValidationError(idx)), browser.params.defaultTimeout);

                                    return chaisePage.recordsetPage.getRangeInputValidationError(idx).getText();
                                }).then(function (text) {
                                    expect(text).toBe(facetParams.error, "The date validation message did not show up or is incorrect");

                                    // test min and max being set
                                    // define test params values
                                    minDateInput.sendKeys(facetParams.range.minDate);
                                    minTimeInput.sendKeys(facetParams.range.minTime);
                                    maxDateInput.sendKeys(facetParams.range.maxDate);
                                    maxTimeInput.sendKeys(facetParams.range.maxTime);

                                    // let validation message disappear
                                    browser.sleep(20);

                                    // get submit button
                                    return chaisePage.recordsetPage.getRangeSubmit(idx).click();
                                }).then(function () {
                                    // wait for request to return
                                    browser.wait(EC.visibilityOf(clearAll), browser.params.defaultTimeout);

                                    // wait for facet filter to load
                                    browser.wait(function () {
                                        return chaisePage.recordsetPage.getFacetFilters().count().then(function (ct) {
                                            return ct == 1;
                                        });
                                    }, browser.params.defaultTimeout);

                                    return chaisePage.recordsetPage.getFacetFilters().count();
                                }).then(function (ct) {
                                    expect(ct).toBe(1, "number of filters is incorrect for '" + facetParams.name + "' facet");

                                    //should only be one
                                    return chaisePage.recordsetPage.getFacetFilters();
                                }).then(function (filters) {
                                    return filters[0].getText();
                                }).then(function (text) {
                                    expect(text).toBe(facetParams.range.filter, "filter name is incorrect for '" + facetParams.name + "' facet");

                                    // wait for table rows to load
                                    browser.wait(function () {
                                        return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                                            return ct == facetParams.range.numRows;
                                        });
                                    }, browser.params.defaultTimeout);

                                    return chaisePage.recordsetPage.getRows().count();
                                }).then(function (ct) {
                                    expect(ct).toBe(facetParams.range.numRows, "number of rows is incorrect for '" + facetParams.name + "' facet");

                                    return clearAll.click();
                                }).then(function () {
                                    browser.wait(EC.not(EC.visibilityOf(clearAll)), browser.params.defaultTimeout);

                                    // make sure all checkboxes are cleared
                                    browser.wait(
                                        EC.not(EC.visibilityOf(chaisePage.recordsetPage.getCheckedFacetOptions(idx))),
                                        browser.params.defaultTimeout,
                                        "clear-all didn't clear checkboxes"
                                    );

                                    //clear the inputs
                                    return minDateClear.click();
                                }).then(function () {
                                    return minTimeClear.click();
                                }).then(function () {
                                    return maxDateClear.click();
                                }).then(function () {
                                    return maxTimeClear.click();
                                });
                            });

                            if (facetParams.notNullNumRows) {
                                it("should be able to filter not-null values.", function (done) {
                                    var notNulloption = chaisePage.recordsetPage.getFacetOption(idx, 0);
                                    chaisePage.clickButton(notNulloption).then(function () {
                                        // wait for table rows to load
                                        browser.wait(function () {
                                            return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                                                return ct == facetParams.notNullNumRows;
                                            });
                                        }, browser.params.defaultTimeout);

                                        return chaisePage.recordsetPage.getRows().count();
                                    }).then(function (ct) {
                                        expect(ct).toBe(facetParams.notNullNumRows, "number of rows (for not-null) is incorrect for '" + facetParams.name + "' facet");
                                        expect(chaisePage.recordsetPage.getRangeSubmit(idx).getAttribute('disabled')).toEqual('true', "submit button enabled after selecting not-null for '" + facetParams.name + "' facet");

                                        return clearAll.click();
                                    }).then(function () {
                                        browser.wait(EC.not(EC.visibilityOf(clearAll)), browser.params.defaultTimeout);
                                        done();
                                    }).catch(chaisePage.catchTestError(done));
                                });
                            }

                            /**
                             * TODO we should figure out the bug that is breaking the next test cases.
                             *
                             * the test cases above are doing the following:
                             * - clear the max input
                             * - click the "all records with value" in timetamp col and make sure it works
                             * - click the "clear all" button which would trigger the update of the facet
                             * and so the max input should be populated based on the historgram request
                             * but for some reason the update is not happening (the request is being triggered though).
                             */
                            // it("should filter on just a min value and update the search criteria.", function () {
                            //     chaisePage.waitForElement(maxDateClear);

                            //     maxDateClear.click().then(function () {
                            //         return maxTimeClear.click();
                            //     }).then(function () {
                            //         // test just min being set
                            //         minDateInput.sendKeys(facetParams.justMin.date);
                            //         minTimeInput.sendKeys(facetParams.justMin.time);

                            //         //let validation dissappear
                            //         browser.sleep(20);

                            //         // get submit button
                            //         return chaisePage.recordsetPage.getRangeSubmit(idx).click()
                            //     }).then(function () {
                            //         // wait for request to return
                            //         browser.wait(EC.visibilityOf(clearAll), browser.params.defaultTimeout);

                            //         // wait for facet filter to load
                            //         browser.wait(function () {
                            //             return chaisePage.recordsetPage.getFacetFilters().count().then(function (ct) {
                            //                 return ct == 1;
                            //             });
                            //         }, browser.params.defaultTimeout);

                            //         //should only be one
                            //         return chaisePage.recordsetPage.getFacetFilters();
                            //     }).then(function (filters) {
                            //         return filters[0].getText();
                            //     }).then(function (text) {
                            //         expect(text).toBe(facetParams.justMin.filter, "filter name is inccorect for '" + facetParams.name + "' facet");

                            //         // wait for table rows to load
                            //         browser.wait(function () {
                            //             return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                            //                 return ct == facetParams.justMin.numRows;
                            //             });
                            //         }, browser.params.defaultTimeout);

                            //         return chaisePage.recordsetPage.getRows().count();
                            //     }).then(function (ct) {
                            //         expect(ct).toBe(facetParams.justMin.numRows, "number of rows is incorrect for '" + facetParams.name + "' facet");

                            //         return clearAll.click();
                            //     }).then(function () {
                            //         browser.wait(EC.not(EC.visibilityOf(clearAll)), browser.params.defaultTimeout);

                            //         // make sure all checkboxes are cleared
                            //         browser.wait(
                            //             EC.not(EC.visibilityOf(chaisePage.recordsetPage.getCheckedFacetOptions(idx))),
                            //             browser.params.defaultTimeout,
                            //             "clear-all didn't clear checkboxes"
                            //         );
                            //     });
                            // });

                            // it("should filter on just a max value and update the search criteria.", function () {
                            //     chaisePage.waitForElement(minDateClear);

                            //     //clear the min inputs
                            //     minDateClear.click().then(function () {
                            //         return minTimeClear.click();
                            //     }).then(function () {
                            //         // test just max being set
                            //         maxDateInput.sendKeys(facetParams.justMax.date);
                            //         maxTimeInput.sendKeys(facetParams.justMax.time);

                            //         //let validation dissappear
                            //         browser.sleep(20);

                            //         // get submit button
                            //         return chaisePage.recordsetPage.getRangeSubmit(idx).click()
                            //     }).then(function () {
                            //         // wait for request to return
                            //         browser.wait(EC.visibilityOf(clearAll), browser.params.defaultTimeout);

                            //         // wait for facet filter to load
                            //         browser.wait(function () {
                            //             return chaisePage.recordsetPage.getFacetFilters().count().then(function (ct) {
                            //                 return ct == 1;
                            //             });
                            //         }, browser.params.defaultTimeout);

                            //         //should only be one
                            //         return chaisePage.recordsetPage.getFacetFilters();
                            //     }).then(function (filters) {
                            //         return filters[0].getText();
                            //     }).then(function (text) {
                            //         expect(text).toBe(facetParams.justMax.filter, "filter name is inccorect for '" + facetParams.name + "' facet");

                            //         // wait for table rows to load
                            //         browser.wait(function () {
                            //             return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                            //                 return ct == facetParams.justMax.numRows;
                            //             });
                            //         }, browser.params.defaultTimeout);

                            //         return chaisePage.recordsetPage.getRows().count();
                            //     }).then(function (ct) {
                            //         expect(ct).toBe(facetParams.justMax.numRows, "number of rows is incorrect for '" + facetParams.name + "' facet");

                            //         return clearAll.click();
                            //     }).then(function () {
                            //         browser.wait(EC.not(EC.visibilityOf(clearAll)), browser.params.defaultTimeout);

                            //         // make sure all checkboxes are cleared
                            //         browser.wait(
                            //             EC.not(EC.visibilityOf(chaisePage.recordsetPage.getCheckedFacetOptions(idx))),
                            //             browser.params.defaultTimeout,
                            //             "clear-all didn't clear checkboxes"
                            //         );

                            //         // close the facet
                            //         return chaisePage.recordsetPage.getFacetHeaderButtonById(idx).click();
                            //     }).catch(function (exc) {
                            //         console.dir(exc);
                            //     });
                            // });

                            // TODO we should remove this when the above has been fixed
                            it ('should close the facet', function (done) {
                                chaisePage.recordsetPage.getFacetHeaderButtonById(idx).click().then(() => {
                                    done();
                                }).catch(chaisePage.catchTestError(done));
                            });
                        });
                    } else if (facetParams.type == "check_presence") {
                        describe("for check_presence facet: " + facetParams.name + ",", function () {
                            it("should open the facet and the two options should be available.", function (done) {
                                browser.wait(function () {
                                    return chaisePage.recordsetPage.getClosedFacets().count().then(function (ct) {
                                        return ct == testParams.totalNumFacets;
                                    });
                                }, browser.params.defaultTimeout);

                                recordSetHelpers.openFacetAndTestFilterOptions(
                                    testParams.name, idx, ['All records with value', 'No value'], done
                                );
                            });

                            it("selecting the not-null option, should only show the applicable rows.", function (done) {
                                recordSetHelpers.testSelectFacetOption(idx, 0, facetParams.name, facetParams.notNullFilter, facetParams.notNullNumRows, done);
                            });

                            it("selecting the null option, should only show the applicable rows.", function (done) {
                                recordSetHelpers.testSelectFacetOption(idx, 1, facetParams.name, facetParams.nullFilter, facetParams.nullNumRows, done);
                            });

                            it("should close the facet.", function (done) {
                                chaisePage.recordsetPage.getFacetHeaderButtonById(idx).click().then(function () {
                                    done();
                                }).catch(function (err) {
                                    done.fail(err);
                                });
                            });
                        });
                    }
                })(testParams.facets[j], j);
            }
        });

        // tests selecting an option for a facet, verifying the filters shown and rows displayed, then moving to the next one while preserving the previous selection
        describe("selecting facet options and verifying row after each selection", function () {

            beforeEach(function () {
                browser.wait(function () {
                    return chaisePage.recordsetPage.getClosedFacets().count().then(function (ct) {
                        return ct == testParams.totalNumFacets;
                    });
                }, browser.params.defaultTimeout);
            });

            for (var i = 0; i < testParams.multipleFacets.length; i++) {
                // anon function to capture looping variable
                (function (facetParams, idx) {
                    it("for facet at index: " + facetParams.facetIdx + ", it should open the facet, select a value to filter on, and update the search criteria.", function () {
                        chaisePage.recordsetPage.getFacetHeaderButtonById(facetParams.facetIdx).click().then(function () {
                            // wait for facet to open
                            browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getFacetCollapse(facetParams.facetIdx)), browser.params.defaultTimeout);

                            // wait for facet checkboxes to load
                            browser.wait(function () {
                                return chaisePage.recordsetPage.getFacetOptions(facetParams.facetIdx).count().then(function (ct) {
                                    return ct == facetParams.numOptions;
                                });
                            }, browser.params.defaultTimeout);

                            // wait for list to be fully visible
                            browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getList(facetParams.facetIdx)), browser.params.defaultTimeout);

                            return chaisePage.clickButton(chaisePage.recordsetPage.getFacetOption(facetParams.facetIdx, facetParams.option));
                        }).then(function () {
                            // wait for request to return
                            browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getClearAllFilters()), browser.params.defaultTimeout);
                            // wait for facet filter to load
                            browser.wait(function () {
                                return chaisePage.recordsetPage.getFacetFilters().count().then(function (ct) {
                                    return ct == idx + 1;
                                });
                            }, browser.params.defaultTimeout);

                            return chaisePage.recordsetPage.getFacetFilters().count();
                        }).then(function (ct) {
                            expect(ct).toBe(idx + 1, "number of filters is incorrect for facet at index: " + facetParams.facetIdx + " facet");

                            // wait for table rows to load
                            browser.wait(function () {
                                return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                                    return ct == facetParams.numRows;
                                });
                            }, browser.params.defaultTimeout);

                            return chaisePage.recordsetPage.getRows().count();
                        }).then(function (ct) {
                            expect(ct).toBe(facetParams.numRows, "number of rows is incorrect for facet at index: " + facetParams.facetIdx + " facet");

                            return chaisePage.recordsetPage.getFacetHeaderButtonById(facetParams.facetIdx).click();
                        }).catch(function (exc) {
                            console.dir(exc);
                        });
                    });
                })(testParams.multipleFacets[i], i);
            }
        });

        describe("selecting facet options in sequence and verifying the data after all selections.", function () {
            beforeAll(function (done) {
                var clearAll = chaisePage.recordsetPage.getClearAllFilters();
                chaisePage.waitForElement(clearAll);

                chaisePage.clickButton(clearAll).then(function () {
                    browser.wait(function () {
                        return chaisePage.recordsetPage.getClosedFacets().count().then(function (ct) {
                            return ct == testParams.totalNumFacets;
                        });
                    }, browser.params.defaultTimeout);

                    done();
                }).catch(function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it("should open facets, click an option in each, and verify the data after", function (done) {
                var numFacets = testParams.multipleFacets.length;

                // open the four facets
                chaisePage.clickButton(chaisePage.recordsetPage.getFacetHeaderButtonById(testParams.multipleFacets[3].facetIdx)).then(function () {
                    browser.wait(function () {
                        return chaisePage.recordsetPage.getClosedFacets().count().then(function (ct) {
                            return ct == testParams.totalNumFacets - 1;
                        });
                    }, browser.params.defaultTimeout);

                    return chaisePage.clickButton(chaisePage.recordsetPage.getFacetHeaderButtonById(testParams.multipleFacets[2].facetIdx));
                }).then(function () {
                    browser.wait(function () {
                        return chaisePage.recordsetPage.getClosedFacets().count().then(function (ct) {
                            return ct == testParams.totalNumFacets - 2;
                        });
                    }, browser.params.defaultTimeout);

                    return chaisePage.clickButton(chaisePage.recordsetPage.getFacetHeaderButtonById(testParams.multipleFacets[1].facetIdx));
                }).then(function () {
                    browser.wait(function () {
                        return chaisePage.recordsetPage.getClosedFacets().count().then(function (ct) {
                            return ct == testParams.totalNumFacets - 3;
                        });
                    }, browser.params.defaultTimeout);

                    return chaisePage.clickButton(chaisePage.recordsetPage.getFacetHeaderButtonById(testParams.multipleFacets[0].facetIdx));
                }).then(function () {
                    // all 4 facets opened
                    browser.wait(function () {
                        return chaisePage.recordsetPage.getOpenFacets().count().then(function (ct) {
                            return ct == numFacets;
                        });
                    }, browser.params.defaultTimeout);

                    //make sure facet is loaded first
                    browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getFacetCollapse(testParams.multipleFacets[0].facetIdx)), browser.params.defaultTimeout);

                    return chaisePage.clickButton(chaisePage.recordsetPage.getFacetOption(testParams.multipleFacets[0].facetIdx, testParams.multipleFacets[0].option));
                }).then(function () {
                    browser.wait(function () {
                        return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                            return ct == testParams.multipleFacets[0].numRows;
                        });
                    }, browser.params.defaultTimeout);

                    return chaisePage.clickButton(chaisePage.recordsetPage.getFacetOption(testParams.multipleFacets[1].facetIdx, testParams.multipleFacets[1].option));
                }).then(function () {
                    browser.wait(function () {
                        return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                            return ct == testParams.multipleFacets[1].numRows;
                        });
                    }, browser.params.defaultTimeout);

                    return chaisePage.clickButton(chaisePage.recordsetPage.getFacetOption(testParams.multipleFacets[2].facetIdx, testParams.multipleFacets[2].option));
                }).then(function () {
                    browser.wait(function () {
                        return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                            return ct == testParams.multipleFacets[2].numRows;
                        });
                    }, browser.params.defaultTimeout);

                    return chaisePage.clickButton(chaisePage.recordsetPage.getFacetOption(testParams.multipleFacets[3].facetIdx, testParams.multipleFacets[3].option));
                }).then(function () {
                    // wait for request to return
                    // wait for facet filters to load
                    browser.wait(function () {
                        return chaisePage.recordsetPage.getFacetFilters().count().then(function (ct) {
                            return ct == numFacets;
                        });
                    }, browser.params.defaultTimeout);

                    return chaisePage.recordsetPage.getFacetFilters().count();
                }).then(function (ct) {
                    expect(ct).toBe(numFacets, "Number of filters is incorrect after making 4 selections");

                    // wait for table rows to load
                    browser.wait(function () {
                        return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                            return ct == testParams.multipleFacets[3].numRows;
                        });
                    }, browser.params.defaultTimeout);

                    return chaisePage.recordsetPage.getRows().count();
                }).then(function (ct) {
                    expect(ct).toBe(testParams.multipleFacets[3].numRows, "number of rows is incorrect after making multiple consecutive selections");
                    done();
                }).catch(function (err) {
                    done.fail(err);
                })
            });
        });
    });
});
