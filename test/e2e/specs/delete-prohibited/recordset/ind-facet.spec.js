var chaisePage = require('../../../utils/chaise.page.js');
var EC = protractor.ExpectedConditions;
var testParams = {
    table_name: "main",
    totalNumFacets: 12,
    facetNames: [ "id", "int_col", "float_col", "date_col", "timestamp_col", "text_col", "longtext_col", "markdown_col", "F1", "to_name", "f3 (term)", "from_name" ],
    defaults: {
        openFacetNames: [ "id", "int_col", "to_name" ],
        numFilters: 2,
        numRows: 1,
        pageSize: 25
    },
    minInputClass: "range-min",
    minInputClearClass: "min-clear",
    maxInputClass: "range-max",
    maxInputClearClass: "max-clear",
    tsMinDateInputClass: "ts-date-range-min",
    tsMinTimeInputClass: "ts-time-range-min",
    tsMaxDateInputClass: "ts-date-range-max",
    tsMaxTimeInputClass: "ts-time-range-max",
    facets: [
        {
            name: "id", 
            type: "choice", 
            totalNumOptions: 10, 
            option: 2, 
            filter: "id: 3", 
            numRows: 1, 
            options: [ '1', '2', '3', '4', '5', '6', '7', '8', '9', '10' ]
        },
        {
            name: "int_col", 
            type: "numeric", 
            listElems: 1,
            range: { 
                min: 5, 
                max: 10, 
                filter: "int_col: 5 to 10", 
                numRows: 4
            },
            justMin: {
                min: 6, 
                filter: "int_col: > 6", 
                numRows: 16
            },
            justMin: {
                min: 6, 
                filter: "int_col: > 6", 
                numRows: 16
            }
        },
        {
            name: "float_col", 
            type: "numeric", 
            listElems: 0, 
            range: {
                min: 6.5, 
                max: 12.2, 
                filter: "float_col: 6.5000 to 12.2000", 
                numRows: 12
            },
            justMin: {
                min: 8.9, 
                filter: "float_col: > 8.9000", 
                numRows: 14
            }
        },
        {
            name: "date_col", 
            type: "date", 
            listElems: 0, 
            range: {
                min: "2002-06-14", 
                max: "2007-12-12", 
                filter: "date_col: 2002-06-14 to 2007-12-12", 
                numRows: 5
            },
            justMin: {
                min: "2009-12-14", 
                filter: "date_col: > 2009-12-14", 
                numRows: 3
            }
        },
        {
            name: "timestamp_col", 
            type: "timestamp", 
            listElems: 0, 
            range: {
                minDate: "2004-05-20", 
                minTime: "10:08:00", 
                maxDate: "2007-12-06", 
                maxTime: "17:26:12", 
                filter: "timestamp_col: 2004-05-20 10:08:00 to 2007-12-06 17:26:12", 
                numRows: 3
            }
        },
        {
            name: "text_col", 
            type: "choice", 
            totalNumOptions: 10, 
            option: 1, 
            filter: "text_col: one", 
            numRows: 5, 
            options: [ 'Empty', 'one', 'two', 'No Value', 'eight', 'eleven', 'five', 'four', 'nine', 'seven' ]
        },
        {
            name: "longtext_col", 
            type: "choice", 
            totalNumOptions: 10, 
            option: 2, 
            filter: "longtext_col: two", 
            numRows: 5, 
            options: [ 'Empty', 'one', 'two', 'No Value', 'eight', 'eleven', 'five', 'four', 'nine', 'seven' ]
        },
        {
            name: "markdown_col", 
            type: "choice", 
            totalNumOptions: 10, 
            option: 4, 
            filter: "markdown_col: eight", 
            numRows: 1, 
            options: [ 'Empty', 'one', 'two', 'No Value', 'eight', 'eleven', 'five', 'four', 'nine', 'seven' ]
        },
        {
            name: "F1", 
            type: "choice", 
            totalNumOptions: 10, 
            option: 1, 
            filter: "F1 : two", 
            numRows: 10, 
            options: [ 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten' ]
        },
        {
            name: "to_name", 
            type: "choice", 
            totalNumOptions: 10, 
            option: 0, 
            filter: "to_name: one", 
            numRows: 10, 
            options: [ 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten' ]
        },
        {
            name: "f3 (term)", 
            type: "choice", 
            totalNumOptions: 2, 
            option: 0, 
            filter: "f3 (term): one", 
            numRows: 6, 
            options: [ 'one', 'two' ]
        },
        {
            name: "from_name", 
            type: "choice", 
            totalNumOptions: 10, 
            option: 4, 
            filter: "from_name: 5", 
            numRows: 1, 
            options: [ '1', '2', '3', '4', '5', '6', '7', '8', '9', '10' ]
        }
    ]
}

describe("Viewing Recordset with Faceting,", function() {

    describe("For table " + testParams.table_name + ",", function() {

        var table, record,
            uri = browser.params.url + "/recordset/#" + browser.params.catalogId + "/faceting:" + testParams.table_name;

        beforeAll(function () {
            browser.ignoreSynchronization=true;
            browser.get(uri);
            chaisePage.waitForElementInverse(element(by.id("spinner")));
        });
        
        describe("default presentation based on facets annotation ", function () {
            it("should have 12 facets", function () {
                chaisePage.recordsetPage.getAllFacets().count().then(function (ct) {
                    expect(ct).toBe(testParams.totalNumFacets, "Number of all facets is incorrect");
                    
                    return chaisePage.recordsetPage.getFacetTitles();
                }).then(function (text) {
                    expect(text).toEqual(testParams.facetNames, "All facets' names is incorrect");
                });
            });
            
            it("should have 3 facets open", function () {
                chaisePage.recordsetPage.getOpenFacets().count().then(function (ct) {
                    expect(ct).toBe(testParams.defaults.openFacetNames.length, "Number of open facets is incorrect");
                    
                    return chaisePage.recordsetPage.getOpenFacetTitles();
                }).then(function (text) {
                    expect(text).toEqual(testParams.defaults.openFacetNames, "Names of open facets are incorrect");
                });
            });

            // test defaults and values shown
            it("'id' facet should have 1 row checked", function () {
                // use 0 index
                chaisePage.recordsetPage.getCheckedFacetOptions(0).count().then(function (ct) {
                    expect(ct).toBe(1);
                });
            });

            it("should have 2 filters selected", function () {
                chaisePage.recordsetPage.getFilters().count().then(function (ct) {  
                    expect(ct).toBe(testParams.defaults.numFilters, "Number of visible filters is incorrect");
                });
            });
            
            it("should have 1 row visible", function () {
                chaisePage.recordsetPage.getRows().count().then(function (ct) {
                    expect(ct).toBe(testParams.defaults.numRows, "Number of visible rows is incorrect");
                });
            });

            it("should have 1 row selected in show more popup.", function () {
                var showMore = chaisePage.recordsetPage.getShowMore(0);

                // open show more, verify only 1 row checked, check another and submit
                showMore.click().then(function () {
                    browser.wait(function () {
                        return chaisePage.recordsetPage.getCheckedModalOptions().count().then(function(ct) {
                            return ct == 1;
                        });
                    });
                    
                    return chaisePage.recordsetPage.getModalOptions();
                }).then(function (options) {
                    // click the 3rd option
                    return chaisePage.clickButton(options[2]);
                }).then(function () {
                    return chaisePage.recordsetPage.getModalSubmit().click();
                }).then(function () {
                    return chaisePage.recordsetPage.getCheckedFacetOptions(0).count();
                }).then(function (ct) {
                    expect(ct).toBe(2, "Number of facet options is incorrect after returning from modal");

                    return chaisePage.recordsetPage.getRows().count();
                }).then(function (ct) {
                    expect(ct).toBe(2, "Number of visible rows after selecting a second option from the modal is incorrect");

                    // search string too
                    chaisePage.recordsetPage.getFacetSearchBox(0).sendKeys(11);

                    browser.wait(function () {
                        return chaisePage.recordsetPage.getFacetOptions(0).count().then(function(ct) {
                            return ct == 3;
                        });
                    });
                    
                    return chaisePage.recordsetPage.getFacetOptions(0).count();
                }).then(function (ct) {
                    expect(ct).toBe(3, "Facet values after search are incorrect");

                    return chaisePage.recordsetPage.getFacetSearchBoxClear(0).click();
                });
            });
            
            it("should show 25 rows and 0 filters after clicking 'clear all'", function () {
                var sortString = "@sort(id)";
                chaisePage.recordsetPage.getClearAllFilters().click().then(function () {
                    return chaisePage.waitForElementInverse(element(by.id("spinner")));
                }).then(function () {
                    //verify there's no facet string in url
                    return browser.getCurrentUrl();
                }).then(function (url) {
                    expect(url).toBe(uri + sortString);
                    
                    return chaisePage.recordsetPage.getRows().count();
                }).then(function (ct) {
                    expect(ct).toBe(testParams.defaults.pageSize, "Number of visible rows is incorrect");
                    
                    return chaisePage.recordsetPage.getFilters().count();
                }).then(function (ct) {
                    expect(ct).toBe(0, "Number of visible filters is incorrect");
                });
            });
        });

        describe("selecting individual filters for each facet type", function () {

            beforeAll(function () {
                // close the facets in opposite order so they dont move when trying to click others
                //close first facet
                chaisePage.recordsetPage.getFacetById(9).click().then(function() {

                    //close second facet
                    return chaisePage.recordsetPage.getFacetById(1).click();
                }).then(function () {
                    
                    //close third facet
                    return chaisePage.recordsetPage.getFacetById(0).click();
                });
            });

            for (var j=0; j<testParams.totalNumFacets; j++) {
                // anon function to capture looping variable
                (function(facetParams, idx) {
                    it("for " + facetParams.name + ", it should open the facet, select a value to filter on, and update the search criteria.", function () {
                        var clearAll = chaisePage.recordsetPage.getClearAllFilters();

                        if (facetParams.type == "choice") {
                            // wait for all facets to be closed
                            browser.wait(function () {
                                return chaisePage.recordsetPage.getClosedFacets().count().then(function(ct) {
                                    return ct == testParams.totalNumFacets;
                                });
                            }).then(function() {
                                // open facet
                                return chaisePage.recordsetPage.getFacetById(idx).click();
                            }).then(function(facet) {
                                // wait for facet to open
                                browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getFacetCollapse(idx)), browser.params.defaultTimeout);

                                // wait for facet checkboxes to load
                                browser.wait(function () {
                                    return chaisePage.recordsetPage.getFacetOptions(idx).count().then(function(ct) {
                                        return ct == facetParams.totalNumOptions;
                                    });
                                });

                                // wait for list to be fully visible
                                browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getList(idx)), browser.params.defaultTimeout);

                                return chaisePage.recordsetPage.getFacetOptionsText(idx);
                            }).then(function (text) {
                                expect(text).toEqual(facetParams.options, "facet options are incorrect for '" + facetParams.name + "' facet");

                                return chaisePage.clickButton(chaisePage.recordsetPage.getFacetOption(idx, facetParams.option));
                            }).then(function () {
                                // wait for request to return
                                browser.wait(EC.visibilityOf(clearAll), browser.params.defaultTimeout);

                                return chaisePage.recordsetPage.getFilters().count();
                            }).then(function (ct) {
                                expect(ct).toBe(1, "number of filters is incorrect for '" + facetParams.name + "' facet");

                                //should only be one
                                return chaisePage.recordsetPage.getFilters();
                            }).then(function (filters) {
                                return filters[0].getText();
                            }).then(function(text) {
                                expect(text).toBe(facetParams.filter, "filter name is inccorect for '" + facetParams.name + "' facet");

                                // wait for table rows to load
                                browser.wait(function () {
                                    return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                                        return ct == facetParams.numRows;
                                    });
                                });

                                return chaisePage.recordsetPage.getRows().count();
                            }).then(function(ct) {
                                expect(ct).toBe(facetParams.numRows, "number of rows is incorrect for '" + facetParams.name + "' facet");
                                
                                return clearAll.click();
                            }).then(function () {
                                browser.wait(EC.not(EC.visibilityOf(clearAll)), browser.params.defaultTimeout);
                                // close the facet
                                return chaisePage.recordsetPage.getFacetById(idx).click();
                            }).catch(function (exc) {
                                console.dir(exc);
                            });
                        } else {
                            //range facet test
                            if (facetParams.type == "numeric" || facetParams.type == "date" ) {
                                var minInput, maxInput, minClear, maxClear;

                                browser.wait(function () {
                                    return chaisePage.recordsetPage.getClosedFacets().count().then(function(ct) {
                                        return ct == testParams.totalNumFacets;
                                    });
                                }).then(function() {
                                    // open facet
                                    return chaisePage.recordsetPage.getFacetById(idx).click();
                                }).then(function(facet) {
                                    // wait for facet to open
                                    browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getFacetCollapse(idx)), browser.params.defaultTimeout);
                                    browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getRangeSubmit(idx)), browser.params.defaultTimeout);
                                    
                                    return chaisePage.recordsetPage.getFacetOptions(idx).count();
                                }).then(function (ct) {
                                    expect(ct).toBe(facetParams.listElems, "There are list elements for '" + facetParams.name + "' facet");

                                    minInput = chaisePage.recordsetPage.getRangeMinInput(idx, testParams.minInputClass);
                                    maxInput = chaisePage.recordsetPage.getRangeMaxInput(idx, testParams.maxInputClass);

                                    // define test params values
                                    minInput.sendKeys(facetParams.range.min);
                                    maxInput.sendKeys(facetParams.range.max);

                                    // let validation message disappear
                                    browser.sleep(10);

                                    return chaisePage.recordsetPage.getRangeSubmit(idx).click();
                                }).then(function () {
                                    // wait for request to return
                                    browser.wait(EC.visibilityOf(clearAll), browser.params.defaultTimeout);

                                    return chaisePage.recordsetPage.getFilters().count();
                                }).then(function (ct) {
                                    expect(ct).toBe(1, "number of filters is incorrect for '" + facetParams.name + "' facet");

                                    //should only be one
                                    return chaisePage.recordsetPage.getFilters();
                                }).then(function (filters) {
                                    return filters[0].getText();
                                }).then(function(text) {
                                    expect(text).toBe(facetParams.range.filter, "filter name is incorrect for '" + facetParams.name + "' facet");

                                    // wait for table rows to load
                                    browser.wait(function () {
                                        return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                                            return ct == facetParams.range.numRows;
                                        });
                                    });

                                    return chaisePage.recordsetPage.getRows().count();
                                }).then(function(ct) {
                                    expect(ct).toBe(facetParams.range.numRows, "number of rows is incorrect for '" + facetParams.name + "' facet");

                                    return clearAll.click();
                                }).then(function () {
                                    browser.wait(EC.not(EC.visibilityOf(clearAll)), browser.params.defaultTimeout);

                                    minClear = chaisePage.recordsetPage.getInputClear(idx, testParams.minInputClearClass);
                                    return minClear.click();
                                }).then(function () {
                                    maxClear = chaisePage.recordsetPage.getInputClear(idx, testParams.maxInputClearClass);
                                    return maxClear.click();
                                }).then(function () {
                                    // test just min being set
                                    minInput.sendKeys(facetParams.justMin.min);
                                    
                                    // let validation message disappear
                                    browser.sleep(10);

                                    return chaisePage.recordsetPage.getRangeSubmit(idx).click();
                                }).then(function () {
                                    // wait for request to return
                                    browser.wait(EC.visibilityOf(clearAll), browser.params.defaultTimeout);

                                    //should only be one
                                    return chaisePage.recordsetPage.getFilters();
                                }).then(function (filters) {
                                    return filters[0].getText();
                                }).then(function(text) {
                                    expect(text).toBe(facetParams.justMin.filter, "filter name is incorrect for '" + facetParams.name + "' facet with just min value");

                                    // wait for table rows to load
                                    browser.wait(function () {
                                        return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                                            return ct == facetParams.justMin.numRows;
                                        });
                                    });

                                    return chaisePage.recordsetPage.getRows().count();
                                }).then(function(ct) {
                                    expect(ct).toBe(facetParams.justMin.numRows, "number of rows is incorrect for '" + facetParams.name + "' facet with just min value");

                                    return clearAll.click();
                                }).then(function () {
                                    browser.wait(EC.not(EC.visibilityOf(clearAll)), browser.params.defaultTimeout);
                                    // close the facet
                                    return chaisePage.recordsetPage.getFacetById(idx).click();
                                }).catch(function (exc) {
                                    console.dir(exc);
                                });
                                // TODO: there's currently an issue with chrome 62 that causes this test case to open a new tab and stop running
                            } else if (false && facetParams.type == "timestamp") {
                                var minDateInput, minTimeInput, maxDateInput, maxTimeInput;

                                browser.wait(function () {
                                    return chaisePage.recordsetPage.getClosedFacets().count().then(function(ct) {
                                        return ct == testParams.totalNumFacets;
                                    });
                                }).then(function() {
                                    // open facet
                                    return chaisePage.recordsetPage.getFacetById(idx).click();
                                }).then(function(facet) {
                                    // wait for facet to open
                                    browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getFacetCollapse(idx)), browser.params.defaultTimeout);
                                    browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getRangeSubmit(idx)), browser.params.defaultTimeout);

                                    minDateInput = chaisePage.recordsetPage.getRangeMinInput(idx, testParams.tsMinDateInputClass);
                                    minTimeInput = chaisePage.recordsetPage.getRangeMinInput(idx, testParams.tsMinTimeInputClass);
                                    maxDateInput = chaisePage.recordsetPage.getRangeMaxInput(idx, testParams.tsMaxDateInputClass);
                                    maxTimeInput = chaisePage.recordsetPage.getRangeMaxInput(idx, testParams.tsMaxTimeInputClass);

                                    // define test params values
                                    minDateInput.sendKeys(facetParams.minDate);
                                    minTimeInput.sendKeys(facetParams.minTime);
                                    maxDateInput.sendKeys(facetParams.maxDate);
                                    maxTimeInput.sendKeys(facetParams.maxTime);

                                    // let validation message disappear
                                    browser.sleep(10);

                                    // get submit button
                                    return chaisePage.recordsetPage.getRangeSubmit(idx).click();
                                }).then(function () {
                                    // wait for request to return
                                    browser.wait(EC.visibilityOf(clearAll), browser.params.defaultTimeout);

                                    return chaisePage.recordsetPage.getFilters().count();
                                }).then(function (ct) {
                                    expect(ct).toBe(1, "number of filters is incorrect for '" + facetParams.name + "' facet");

                                    //should only be one
                                    return chaisePage.recordsetPage.getFilters();
                                }).then(function (filters) {
                                    return filters[0].getText();
                                }).then(function(text) {
                                    expect(text).toBe(facetParams.filter, "filter name is inccorect for '" + facetParams.name + "' facet");

                                    // wait for table rows to load
                                    browser.wait(function () {
                                        return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                                            return ct == facetParams.numRows;
                                        });
                                    });

                                    return chaisePage.recordsetPage.getRows().count();
                                }).then(function(ct) {
                                    expect(ct).toBe(facetParams.numRows, "number of rows is incorrect for '" + facetParams.name + "' facet");

                                    return clearAll.click();
                                }).then(function () {
                                    browser.wait(EC.not(EC.visibilityOf(clearAll)), browser.params.defaultTimeout);
                                    // close the facet
                                    return chaisePage.recordsetPage.getFacetById(idx).click();
                                }).catch(function (exc) {
                                    console.dir(exc);
                                });
                            }
                        }
                    });
                })(testParams.facets[j], j);
            }
        });
    });
});
