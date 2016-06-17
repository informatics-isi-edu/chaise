/**
 * Created by shuai on 2/2/16.
 */
var chaisePage = require('../chaise.page.js');
var filterObj = chaisePage.resultContent.filter;
var config = chaisePage.getConfig(['Filters on top of the records,']);
var filterCount = 0;


var testAttributes = function(attr, attrCount) {
    describe("for attribute " + attr.text, function() {     
        var startInd = attr.clearAllFilters ? 0 : ( attr.clearPreviousFilters ? attrCount - 1 : attrCount);
        var endIndex = attrCount;
        var contentCount = 0;
        filterCount = filterCount - (endIndex - startInd);
        filterCount++;

        beforeAll(function() {
            for (var i = startInd; i < endIndex; i++) {
               var previousAttr = config.attributes[i];
               filterObj.clickFilterWrapperCancelByName(previousAttr.text); 
            }
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
                for (i = 0; i < attr.filters[contentCount - 1].content.length; i++) {  
                    var c = chaisePage.editFilter.findCheckStatusDivByName(filter.content[i]);
                    chaisePage.customExpect.elementContainClass(c, 'disabled');
                }
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
                expect(title).toContain(filter.content.join(', '));
            });
        });

        // As filterCount starts from 0, we need to add a 1
        it('should show ' + filterLen + ' filter wrappers after \'' + filter.content.join(', ') + '\' in \'' + attr.text + '\' is checked', function () {
            // Displayed filters also contains the clear all filters so we need to add 1 more filter to take that in consideration
            expect(filterObj.displayedFilters.count()).toBe(filterLen + 1);
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
    
    afterAttributeTestCompletion();
});
