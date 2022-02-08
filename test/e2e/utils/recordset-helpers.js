var chaisePage = require('../utils/chaise.page.js');
var fs = require('fs');
var EC = protractor.ExpectedConditions;

/**
 * Opens the facet and checks the title of filter options
 * @param  {string}   name          title of facet
 * @param  {int}   facetIdx         facet index
 * @param  {Array}   filterOptions   array of filter titles
 * @param  {Function} done
 */
exports.openFacetAndTestFilterOptions = function (name, facetIdx, filterOptions, done) {
    // open facet
    chaisePage.recordsetPage.getFacetById(facetIdx).click().then(function() {
        // wait for facet to open
        browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getFacetCollapse(facetIdx)), browser.params.defaultTimeout);

        // wait for facet checkboxes to load
        browser.wait(function () {
            return chaisePage.recordsetPage.getFacetOptions(facetIdx).count().then(function(ct) {
                return ct == filterOptions.length;
            });
        }, browser.params.defaultTimeout);

        // wait for list to be fully visible
        browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getList(facetIdx)), browser.params.defaultTimeout);

        return chaisePage.recordsetPage.getFacetOptionsText(facetIdx);
    }).then(function (text) {
            expect(text).toEqual(filterOptions, "facet options are incorrect for '" + name + "' facet");
            done();
    }).catch(function (err) {
        done.fail(err);
    });
}

/**
 * It will select the given filter, and then clear all the filters.
 * Assumptions:
 * - Only the current facet column can have filters.
 * - Current facet column is already open.
 * @param  {int}   facetIdx     facet index
 * @param  {int}   filterIdx    filter index
 * @param  {string}   facetName    facet title
 * @param  {string}   filterName   filter title in the main content
 * @param  {int}   numRowsAfter number of rows after applying the filter
 * @param  {Function} done
 */
exports.testSelectFacetOption = function (facetIdx, filterIdx, facetName, filterName, numRowsAfter, done) {
    var clearAll = chaisePage.recordsetPage.getClearAllFilters();
    var facetOption = chaisePage.recordsetPage.getFacetOption(facetIdx, filterIdx);

    chaisePage.clickButton(facetOption).then(function () {
        // wait for table rows to load
        browser.wait(function () {
            return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                return ct == numRowsAfter;
            });
        }, browser.params.defaultTimeout);

        return chaisePage.recordsetPage.getRows().count();
    }).then(function(ct) {
        expect(ct).toBe(numRowsAfter, "number of rows is incorrect for '" + facetName + "' facet");

        //should only be one
        return chaisePage.recordsetPage.getFacetFilters();
    }).then(function (filters) {
        return filters[0].getText();
    }).then(function(text) {
        expect(text).toBe(filterName, "filter name is incorrect for '" + facetName + "' facet");
        return clearAll.click();
    }).then(function () {
        browser.wait(EC.not(EC.visibilityOf(clearAll)), browser.params.defaultTimeout);
        expect(facetOption.isSelected()).toBeFalsy("filter is selected after clear all for '" + facetName + "' facet");
        done();
    }).catch(function (err) {
        done.fail(err);
    });
};

exports.deleteDownloadedFiles = function (fileNames) {
    fileNames.forEach(function (name) {
        var filename = process.env.PWD + "/test/e2e/" + name;
        if (fs.existsSync(filename)) {
            // delete if there is any existing file with same name
            fs.unlinkSync(filename);
            console.log("file: " + filename + " has been removed");
        }
    });
};
