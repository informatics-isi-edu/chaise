var chaisePage = require('../../../utils/chaise.page.js');
var testParams = {
    table_name: "main",
    openFacetNames: [ "id", "int_col", "to_name" ]
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
                    expect(ct).toBe(3, "Number of open facets is incorrect");
                    
                    return chaisePage.recordsetPage.getOpenFacetTitles();
                }).then(function (text) {
                    expect(text).toEqual(testParams.openFacetNames, "Names of open facets are incorrect");
                });
            });
            
            it("should have 2 filters selected", function () {
                chaisePage.recordsetPage.getFilters().count().then(function (ct) {  
                    expect(ct).toBe(2, "Number of visible filters is incorrect");
                });
            });
            
            it("should have 1 row visible", function () {
                chaisePage.recordsetPage.getRows().count().then(function (ct) {
                    expect(ct).toBe(1, "Number of visible rows is incorrect");
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
                    expect(ct).toBe(25, "Number of visible rows is incorrect");
                    
                    return chaisePage.recordsetPage.getFilters().count();
                }).then(function (ct) {
                    expect(ct).toBe(0, "Number of visible filters is incorrect");
                });
            });
        });

        // describe("selecting individual filters for each facet type", function () {
        // 
        //     beforeAll(function () {
        //         var openFacets = chaisePage.recordsetPage.getOpenFacets();
        //         // need to implement
        //         var allFacets = chaisePage.recordsetPage.getAllFacets();
        //         
        //         for (var i=0; i<openFacets.length; i++) {
        //             // close the facets
        //             openFacets[i].click();
        //         }
        //     });
        // 
        //     for (var j=0; j<allFacets.length; j++) {
        //         it("should open the facet, select a value to filter on, and update the search criteria.", function () {
        //             var facet = allFacets[j];
        //             
        //             if (isChoicePicker(facet) {
        //                 // open facet
        //                 facet.click().then(function () {
        //                     // implement recordsetPage getter
        //                     // get the 3rd value and click on it's checkbox
        //                     return chaisePage.recordsetPage.getFacetOptions()[2].click()
        //                 }).then(function () {
        //                     //might need a wait here
        //                     return chaisePage.recordsetPage.getFilters().count();
        //                 }).then(function (ct) {
        //                     expect(ct).toBe(1);
        //                     
        //                     //should only be one
        //                     return chaisePage.recordsetPage.getFilters()[0].getText();
        //                 }).then(function(text) {
        //                     expect(text).toBe("filter displayname");
        //                 
        //                     return chaisePage.recordsetPage.getRows().count();
        //                 }).then(function(ct) {
        //                     expect(ct).toBe(numberOfMatchingRows);
        //                     
        //                     return chaisePage.recordsetPage.getClearAllFilters().click();
        //                 }).then(function () {
        //                     // close the facet
        //                     return facet.click();
        //                 });
        //             } else {
        //                 //range facet test
        //                 if (isNumeric(facet) || isDate(facet) ) {
        //                     var minInput = chaisePage.recordsetPage.getRangeMinInput();
        //                     var maxInput = chaisePage.recordsetPage.getRangeMaxInput();
        //                     
        //                     // open the facet
        //                     facet.click().then(function () {
        //                         // define test params values
        //                         minInput.sendKeys(testParams.val);
        //                         maxInput.sendKeys(testParams.val);
        //                     
        //                         // get submit button
        //                         return chaisePage.recordsetPage.getRangeSubmit().click();
        //                     }).then(function () {
        //                         return chaisePage.recordsetPage.getFilters().count();
        //                     }).then(function (ct) {
        //                         expect(ct).toBe(1);
        //                     
        //                         //should only be one
        //                         return chaisePage.recordsetPage.getFilters()[0].getText();
        //                     }).then(function(text) {
        //                         expect(text).toBe("filter displayname");
        //                 
        //                         return chaisePage.recordsetPage.getRows().count();
        //                     }).then(function(ct) {
        //                         expect(ct).toBe(numberOfMatchingRows);
        //                         
        //                         return chaisePage.recordsetPage.getClearAllFilters().click();
        //                     }).then(function () {
        //                         // close the facet
        //                         return facet.click();
        //                     });
        //                 } else if (isTimestamp(facet)) {
        //                     // do timestamp test
        //                 }
        //             }
        //         });
        //     }
        // });
    });
});
