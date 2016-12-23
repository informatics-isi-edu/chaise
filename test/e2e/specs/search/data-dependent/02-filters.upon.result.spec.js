/**
 * Created by shuai on 2/2/16.
 */
var chaisePage = require('../../../utils/chaise.page.js');
var filterObj = chaisePage.resultContent.filter;
var config = chaisePage.getConfig(['Filters on top of the records,']);
var filterCount = 0;


var testAttributes = function(attr, attrCount) {
    describe("for attribute " + attr.text, function() {
        var clearAttributes = [];
        if (!attr.clearAllFilters && attr.clearPreviousFilters) {
            if (attr.clearPreviousFilters.length > 0) {
                clearAttributes = attr.clearPreviousFilters;
            } else {
                startInd = attrCount - 1;
                clearAttributes.push(startInd);
            }
        }

        var endIndex = attrCount;
        var contentCount = 0;
        filterCount = filterCount - clearAttributes.length;
        filterCount++;

        beforeAll(function() {

            clearAttributes.forEach(function(ca) {
                 filterObj.clickFilterWrapperCancelByName(config.attributes[ca].text);
            });
        });

        attr.filters.forEach(function(filter) {
            testFilters(attr, filter, attrCount, filterCount, contentCount);
            contentCount++;
        });

        it('should show ' + attr.totalContentCount + ' edit filters in \'' + attr.text + '\' wrapper', function(){
            if (attr.totalContentCount != undefined) {
                expect(chaisePage.editFilter.getEditFilterAttrsDisplayed().count()).toBe(attr.totalContentCount);
            }
        });


        it('should show ' + attr.totalEntityCount + ' results in all for attribute ' + attr.text, function () {
            if (attr.totalEntityCount != undefined) {

                browser.wait(function() {
                    return chaisePage.resultContent.getAllResultRows().count().then(function(count) {
                      return count == attr.totalEntityCount;
                    });
                }, browser.params.defaultTimeout).finally(function() {
                    expect(chaisePage.resultContent.getAllResultRows().count()).toBe(attr.totalEntityCount);
                });

            }
        });

        it('should go back to initial sidebar', function () {
            chaisePage.editFilter.goBackToSidebar();
            expect(chaisePage.sidebar.sidebarHeader.isDisplayed()).toBe(true);
            expect(chaisePage.editFilter.sidebarHeader.getText()).toBe('');
        });
    });
};

var testFilters = function(attr, filter, attrCount, filterLen, contentCount) {
    describe('after checking ' + filter.content.length + ' edit filter(s) (\'' + filter.content.join(', ') + '\') in \'' + attr.text + '\',', function () {

        if (contentCount > 0) {
            it("should uncheck edit filters when cancel is clicked", function() {
                filterObj.clickFilterWrapperCancelByName(attr.text);
                var filters = chaisePage.editFilter.getCheckedEditFilters();
                expect(filters.count()).toBe(0);
            });
        } else {
            it('should click the attr ' + attr.text + ' in sidebar', function() {
                chaisePage.sidebar.clickSidebarAttr(attr.text);
            });
        }

        it('should check ' + filter.content.join(', ') + ' filters for an attribute ' + attr.text, function() {
            filter.content.forEach(function(c) {
                chaisePage.editFilter.clickEditFilter(c);
            });
        });

        it('should show the \'Clear All Filters\' button', function () {
            var clearAllBtn = filterObj.clearAllBtn;

            chaisePage.waitForElementCondition(filterObj.clearAllBtn.isDisplayed()).finally(function() {
                expect(clearAllBtn.isDisplayed()).toBe(true);
            });
            
        });

        it('should show \'' + attr.text + '\' wrapper', function () {
            var attrTextWrapper = filterObj.findFilterWrapperByName(attr.text);
            expect(attrTextWrapper.isDisplayed()).toBe(true);
        });

        it('should show ' + filter.content.length + ' edit filter in \'' + attr.text + '\' wrapper', function () {
            expect(chaisePage.resultContent.filter.findCheckedSubfiltersByName(attr.text).count()).toBe(filter.content.length);
        });


        if (filter.entityCount != undefined) {

            it('should show ' + filter.entityCount + ' results for filters ' + filter.content.join(','), function () {
                if (filter.entityCount != undefined) {
                    browser.wait(function() {
                        return chaisePage.resultContent.getAllResultRows().count().then(function(count) {
                          return count == filter.entityCount;
                        });
                    }, browser.params.defaultTimeout).finally(function() {
                        expect(chaisePage.resultContent.getAllResultRows().count()).toBe(filter.entityCount);
                    });
                }
            });


            it('should display records according to the selected view option. Default is the table view. ', function() {
                browser.executeScript('return window.CHAISE_DATA.view;').then(function(viewType) {
                    var el = chaisePage.resultContent.currentRecordCount;
                    el.getText().then(function(txt) {
                        var recordCount = txt.split('-')[1];
                        expect(chaisePage.resultContent.getResultRowsByViewType(viewType).count()).toBe(parseInt(recordCount));
                    });
                });
            });

            it('should have the number of items shown to be consistent with the numbers of rows shown.', function() {
                var allResults = chaisePage.resultContent.getAllResultRows();
                allResults.count().then(function(count) {
                    var el = chaisePage.resultContent.currentRecordCount;
                    el.getText().then(function(txt) {
                        var recordCount = txt.split('-')[1];
                        expect(parseInt(recordCount)).toBe(count);
                    });
                });
            });

            it('should have the number of results shown to be consistent with the total numbers of rows satisying the search criteria.', function() {
                var el = chaisePage.resultContent.numOfRecords
                el.getText().then(function(txt) {
                    expect(parseInt(txt)).toBe(filter.entityCount);
                    //browser.pause();
                });
            });

        }

        it('should show \'' + filter.content.join(', ') + '\' in \'' + attr.text + '\' wrapper', function () {
            filterObj.findFilterWrapperTitleByWrapperName(attr.text).then(function(title) {
                filter.content.forEach(function(content) {
                    expect(title).toContain(content);
                });
            });
        });

        // As filterCount starts from 0, we need to add a 1
        it('should show ' + filterLen + ' filter wrappers after \'' + filter.content.join(', ') + '\' in \'' + attr.text + '\' is checked', function () {
            // Displayed filters also contains the clear all filters so we need to add 1 more filter to take that in consideration
            expect(filterObj.displayedFilters.count()).toBe(filterLen + 1);
        });



        /*xit('the permalink should be same as the window url', function() {
            browser.executeScript('return window.location.href;').then(function(currentUrl) {
                chaisePage.resultContent.permalink.getAttribute('href').then(function(href) {
                    console.log(href);
                    expect(href).toBe(currentUrl);
                });

            });
        }); */

        it('the column names and values should be escaped properly', function() {
            browser.executeScript('return window.location.hash;').then(function(hash) {
                var facets = hash.substring(hash.indexOf('facets=(') + 8, hash.indexOf(')'));
                expect(/[!'()*]/.test(facets)).toBe(false);
            });
        });

    });
};

var testResultContent = function() {
    describe('one randomly chosen record in the results,', function () {

        var randResult, rand, length;

        it('should be chosen randomly', function () {
            var allResults = chaisePage.resultContent.getAllResultRows();
            allResults.then(function (items) {
                length = items.length;
                rand = chaisePage.tools.getRandomInt(0, items.length - 1);
                randResult = allResults.get(rand);
                expect(randResult.isDisplayed()).toBe(true);
            });
        });

        it('should have non-empty title', function () {
            var titleEle = chaisePage.resultContent.getResultTitleElement(randResult);
            expect(titleEle.getText()).not.toBe('');
        });

        it('should display the title', function () {
            var titleEle = chaisePage.resultContent.getResultTitleElement(randResult);
            expect(titleEle.isDisplayed()).toBe(true);
        });


        it('should display the image', function () {
            var imgEle = chaisePage.resultContent.getResultImgElement(randResult);
            expect(imgEle.isDisplayed()).toBe(true);
        });

    });
};

var afterAttributeTestCompletion = function() {

    describe('after \'Clear All Filters\' is clicked', function () {
        it('should show 0 filter wrappers and go back to initial sidebar', function () {
            filterObj.clickClearAllBtn();
            expect(filterObj.displayedFilters.count()).toBe(0);
        });

        it('should show correct initial sidebar header', function () {
            expect(chaisePage.sidebar.sidebarHeader.getText()).toBe('CHOOSE ATTRIBUTES');
        });

        config.attributes.forEach(function(attr) {
            determineFiltersUnchecked(attr);
        });

    });
};

var determineFiltersUnchecked = function(attr) {
    var filter = attr.filters[attr.filters.length - 1];

    it('should have unchecked \'' + filter.content.length + '\' edit filter in \'' + attr.text + '\'', function () {
        var EC = protractor.ExpectedConditions,
            sidebar = element(by.id("sidebar"));

        browser.wait(EC.visibilityOf(sidebar), browser.params.defaultTimeout);

        chaisePage.sidebar.clickSidebarAttr(attr.text);
        filter.content.forEach(function(c) {
            var el = chaisePage.editFilter.findCheckStatusDivByName(c);
            chaisePage.customExpect.elementContainClass(el, 'disabled');
        });
        chaisePage.editFilter.goBackToSidebar();
    });
};

describe('Filters on top of the records,', function () {
    var EC = protractor.ExpectedConditions;

    beforeAll(function (done) {
        browser.get(browser.params.url || "");
        var sidebar = element(by.id('sidebar'));
        browser.wait(EC.visibilityOf(sidebar), browser.params.defaultTimeout).then(function () {
            done();
        });
    });

    if (!config || !config.attributes || !config.attributes.length ) return;

    var attrCount = 0;
    config.attributes.forEach(function(attr) {
        testAttributes(attr, attrCount);
        attrCount++;
    });

    testResultContent();
    afterAttributeTestCompletion();

    describe("tour execution, ", function() {
        var tourButton = chaisePage.tourButton;

        it('should show the tour button', function() {
            expect(tourButton.isDisplayed()).toBe(true);
        });

        it('should click on tour button to start the tour', function() {
            tourButton.click().then(function() {
                chaisePage.waitForElement(chaisePage.tourBox).finally(function() {
                    expect(chaisePage.tourBox.isDisplayed()).toBe(true);
                });
            });
        });
    });
});
