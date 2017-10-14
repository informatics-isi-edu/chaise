var chaisePage = require('../../../utils/chaise.page.js');
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
        {name: "id", type: "choice"},
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

            var allFacets;

            beforeAll(function () {
                chaisePage.recordsetPage.getAllFacets().then(function (facets) {
                    allFacets = facets;
                    // close the facets in opposite order so they dont move when trying to click others
                    return chaisePage.recordsetPage.getFacetById("fc-heading-9");
                }).then(function(facet) {
                    //close first facet
                    return facet.click();
                }).then(function () {

                    return chaisePage.recordsetPage.getFacetById("fc-heading-1");
                }).then(function (facet) {
                    //close second facet
                    return facet.click();
                }).then(function () {
                    
                    return chaisePage.recordsetPage.getFacetById("fc-heading-0");
                }).then(function (facet) {
                    //close third facet
                    browser.pause();
                    return facet.click();
                });
            });

            for (var j=0; j<testParams.totalNumFacets; j++) {
                it("for " + testParams.facets[j].name + ", it should open the facet, select a value to filter on, and update the search criteria.", function () {
                    // if (isChoicePicker(facet) {
                    //     // open facet
                    //     facet.click().then(function () {
                    //         // implement recordsetPage getter
                    //         // get the 3rd value and click on it's checkbox
                    //         return chaisePage.recordsetPage.getFacetOptions()[2].click()
                    //     }).then(function () {
                    //         //might need a wait here
                    //         return chaisePage.recordsetPage.getFilters().count();
                    //     }).then(function (ct) {
                    //         expect(ct).toBe(1);
                    //         
                    //         //should only be one
                    //         return chaisePage.recordsetPage.getFilters()[0].getText();
                    //     }).then(function(text) {
                    //         expect(text).toBe("filter displayname");
                    //     
                    //         return chaisePage.recordsetPage.getRows().count();
                    //     }).then(function(ct) {
                    //         expect(ct).toBe(numberOfMatchingRows);
                    //         
                    //         return chaisePage.recordsetPage.getClearAllFilters().click();
                    //     }).then(function () {
                    //         // close the facet
                    //         return facet.click();
                    //     });
                    // } else {
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
                    // }
                });
            }
        });
    });
});
