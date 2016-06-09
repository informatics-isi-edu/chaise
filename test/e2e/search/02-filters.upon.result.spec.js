/**
 * Created by shuai on 2/2/16.
 */
var chaisePage = require('../chaise.page.js');
var filterObj = chaisePage.resultContent.filter;

describe('Filters on top of the records,', function () {
    var EC = protractor.ExpectedConditions;

    beforeAll(function (done) {
        browser.get(browser.params.url || "");
        var sidebar = element(by.id('sidebar'));
        browser.wait(EC.visibilityOf(sidebar), 10000).then(function () {
            done();
        });
    });

    var config = chaisePage.getConfig(['Filters on top of the records,']);

    if (!config || !config.attribute1 || !config.attribute1.filters || !config.attribute1.filters.length) return;

    var attribute1 = config.attribute1;
    var expeSubfilters = filterObj.findCheckedSubfiltersByName(attribute1.text);

    describe('after checking 1 edit filter (\'' + attribute1.filters[0] + '\' in \'' + attribute1.text + '\'),', function () {
        it('should show the \'Clear All Filters\' button', function () {
            chaisePage.sidebar.clickSidebarAttr(attribute1.text);
            chaisePage.editFilter.clickEditFilter(attribute1.filters[0]);
            var clearAllBtn = filterObj.clearAllBtn;
            expect(clearAllBtn.isDisplayed()).toBe(true);
        });

        it('should show \'' + attribute1.text + '\' wrapper', function () {
            var microWrapper = filterObj.findFilterWrapperByName(attribute1.text);
            expect(microWrapper.isDisplayed()).toBe(true);
        });

        it('should show 1 edit filter in \'' + attribute1.text + '\' wrapper', function () {
            expect(expeSubfilters.count()).toBe(1);
        });

        it('should show \'' + attribute1.filters[0] + '\' in \'' + attribute1.text + '\' wrapper', function () {
            var title = filterObj.findFitlerWrapperTitleByWrapperName(attribute1.text);
            expect(title).toContain(attribute1.filters[0]);
        });
    });

    if (attribute1.filters.length > 1) {

        var filters = [];

        it('should show ' + attribute1.filters.length + ' edit filters in \'' + attribute1.text + '\' wrapper ' + 'after ' + (attribute1.filters.length-1) + ' more edit filters are checked', function () {
            for (i = 0; i < attribute1.filters.length; i++) {  
                var f = chaisePage.editFilter.findCheckStatusDivByName(attribute1.filters[i]);
                filters.push(f);
                if (i > 0) chaisePage.editFilter.clickEditFilter(attribute1.filters[i]);
            }
            expect(filters[0].getAttribute('class')).not.toContain('disabled');
            expect(expeSubfilters.count()).toBe(filters.length);
        });

        it('should uncheck edit filters when cancel is clicked', function () {
            filterObj.clickFilterWrapperCancelByName(attribute1.text);
            for (i = 0; i < filters.length; i++) {  
                chaisePage.customExpect.elementContainClass(filters[i], 'disabled');
            }
        });

        it('should check \'' + attribute1.filters[1] + '\' and go back to initial sidebar', function () {
            chaisePage.editFilter.clickEditFilter(attribute1.filters[1]);
            chaisePage.editFilter.goBackToSidebar();
            expect(chaisePage.sidebar.sidebarHeader.isDisplayed()).toBe(true);
            expect(chaisePage.editFilter.sidebarHeader.getText()).toBe('');
        });
    }

    var secondAttributeSet = false;
    if (config.attribute2 && config.attribute2.filters && config.attribute2.filters.length)  {

        secondAttributeSet = true;
        var attribute2 = config.attribute2;

        it('should show 2 filter wrappers after \'' + attribute2.filters[0] + '\' in \'' + attribute2.text + '\' is checked', function () {
            chaisePage.sidebar.clickSidebarAttr(attribute2.text);
            chaisePage.editFilter.clickEditFilter(attribute2.filters[0]);
            //Experiment Type, Data Type, Clear All Filters add up to 3
            expect(filterObj.displayedFilters.count()).toBe(3);
        });

    }

    describe('after \'Clear All Filters\' is clicked', function () {
        it('should show 0 filter wrappers and go back to initial sidebar', function () {
            filterObj.clickClearAllBtn();
            expect(filterObj.displayedFilters.count()).toBe(0);
        });

        it('should show correct initial sidebar header', function () {
            expect(chaisePage.sidebar.sidebarHeader.getText()).toBe('CHOOSE ATTRIBUTES:');
        });

        it('should have unchecked \'' + attribute1.filters[1] + '\' edit filter in \'' + attribute1.text + '\'', function () {
            chaisePage.sidebar.clickSidebarAttr(attribute1.text);
            var el = chaisePage.editFilter.findCheckStatusDivByName(attribute1.filters[1]);
            chaisePage.customExpect.elementContainClass(el, 'disabled');
        });

        if (secondAttributeSet) {

            it('should have unchecked \'' + attribute2.filters[0] + '\' in \'' + attribute2.text + '\'', function () {
                chaisePage.editFilter.goBackToSidebar();
                chaisePage.sidebar.clickSidebarAttr(attribute2.text);
                var el = chaisePage.editFilter.findCheckStatusDivByName(attribute2.filters[0]);
                chaisePage.customExpect.elementContainClass(el, 'disabled');
            });
        }
    });

});
