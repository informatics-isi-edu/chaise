var chaisePage = require('../../../utils/chaise.page.js');
var EC = protractor.ExpectedConditions;
var testParams = {
    table_name: "main",
    totalNumFacets: 12,
    defaults: {
        openFacetNames: [ "id", "int_col", "to_name" ],
        numFilters: 2,
        numRows: 1,
        pageSize: 25
    },
    facets: [
        {name: "id", type: "choice", option: 2, filter: "id: 3", numRows: 1},
        {name: "int_col", type: "range"},
        {name: "float_col", type: "range"},
        {name: "date_col", type: "range"},
        {name: "timestamp_col", type: "range"},
        {name: "text_col", type: "choice"},
        {name: "longtext_col", type: "choice"},
        {name: "markdown_col", type: "choice"},
        {name: "F1", type: "choice"},
        {name: "to_name", type: "choice"},
        {name: "f3 (term)", type: "choice"},
        {name: "from_name", type: "choice"}
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
            it("should have 3 facets open", function () {
                chaisePage.recordsetPage.getOpenFacets().count().then(function (ct) {
                    expect(ct).toBe(testParams.defaults.openFacetNames.length, "Number of open facets is incorrect");
                    
                    return chaisePage.recordsetPage.getOpenFacetTitles();
                }).then(function (text) {
                    expect(text).toEqual(testParams.defaults.openFacetNames, "Names of open facets are incorrect");
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

            for (var j=0; j<1; j++) {
                // anon function to capture looping variable
                (function(facetParams, idx) {
                    it("for " + facetParams.name + ", it should open the facet, select a value to filter on, and update the search criteria.", function () {
                        var facetElem = chaisePage.recordsetPage.getFacetById(idx),
                            clearAll = chaisePage.recordsetPage.getClearAllFilters();

                        if (facetParams.type == "choice") {
                            // open facet
                            facetElem.click().then(function(facet) {
                                // wait for facet to open
                                return chaisePage.recordsetPage.getFacetOptions(idx);
                            }).then(function (options) {

                                return options[facetParams.option].click()
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
                                
                                return chaisePage.recordsetPage.getRows().count();
                            }).then(function(ct) {
                                expect(ct).toBe(facetParams.numRows, "number of rows is incorrect for '" + facetParams.name + "' facet");
                                
                                return clearAll.click();
                            }).then(function () {
                                // close the facet
                                return facetElem.click();
                            });
                        } else {
                            //     //range facet test
                            //     if (isNumeric(facet) || isDate(facet) ) {
                            //         var minInput = chaisePage.recordsetPage.getRangeMinInput();
                            //         var maxInput = chaisePage.recordsetPage.getRangeMaxInput();
                            //         
                            //         // open the facet
                            //         facet.click().then(function () {
                            //             // define test params values
                            //             minInput.sendKeys(testParams.val);
                            //             maxInput.sendKeys(testParams.val);
                            //         
                            //             // get submit button
                            //             return chaisePage.recordsetPage.getRangeSubmit().click();
                            //         }).then(function () {
                            //             return chaisePage.recordsetPage.getFilters().count();
                            //         }).then(function (ct) {
                            //             expect(ct).toBe(1);
                            //         
                            //             //should only be one
                            //             return chaisePage.recordsetPage.getFilters()[0].getText();
                            //         }).then(function(text) {
                            //             expect(text).toBe("filter displayname");
                            //     
                            //             return chaisePage.recordsetPage.getRows().count();
                            //         }).then(function(ct) {
                            //             expect(ct).toBe(numberOfMatchingRows);
                            //             
                            //             return chaisePage.recordsetPage.getClearAllFilters().click();
                            //         }).then(function () {
                            //             // close the facet
                            //             return facet.click();
                            //         });
                            //     } else if (isTimestamp(facet)) {
                            //         // do timestamp test
                            //     }
                        }
                    });
                })(testParams.facets[j], j);
            }
        });
    });
});
