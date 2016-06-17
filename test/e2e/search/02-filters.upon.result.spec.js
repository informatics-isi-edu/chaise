/**
 * Created by shuai on 2/2/16.
 */
var chaisePage = require('../chaise.page.js');
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
                browser.sleep(1000);
                var allResults = chaisePage.resultContent.getAllResultRows();
                expect(allResults.count()).toBe(attr.totalEntityCount);
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
        
        it('should check ' + filter.content.join(', ') + ' filters for an attribute' + attr.text, function() {
            filter.content.forEach(function(c) {
                chaisePage.editFilter.clickEditFilter(c);
            });
        });

        it('should show the \'Clear All Filters\' button', function () {
            var clearAllBtn = filterObj.clearAllBtn;
            expect(clearAllBtn.isDisplayed()).toBe(true);
        });

        it('should show \'' + attr.text + '\' wrapper', function () {
            var attrTextWrapper = filterObj.findFilterWrapperByName(attr.text);
            expect(attrTextWrapper.isDisplayed()).toBe(true);
        });

        it('should show ' + filter.content.length + ' edit filter in \'' + attr.text + '\' wrapper', function () {
            expect(chaisePage.resultContent.filter.findCheckedSubfiltersByName(attr.text).count()).toBe(filter.content.length);
        });

        it('should show ' + filter.entityCount + ' results for filters ' + filter.content.join(','), function () {
            if (filter.entityCount != undefined) {
                browser.sleep(3000);
                var allResults = chaisePage.resultContent.getAllResultRows();
                expect(allResults.count()).toBe(filter.entityCount);
            }
        });

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
            expect(chaisePage.sidebar.sidebarHeader.getText()).toBe('CHOOSE ATTRIBUTES:');
        });

        config.attributes.forEach(function(attr) {
            determineFiltersUnchecked(attr);
        });

    });
};

var determineFiltersUnchecked = function(attr) {
    var filter = attr.filters[attr.filters.length - 1];

    it('should have unchecked \'' + filter.content.length + '\' edit filter in \'' + attr.text + '\'', function () {
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
        browser.wait(EC.visibilityOf(sidebar), 10000).then(function () {
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
});
