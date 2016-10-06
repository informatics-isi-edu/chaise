/**
 *
 * Created by shuai.
 *
 * Test the initial sidebar.
 * Checking attributes in View all attributes will show them in initial sidebar list.
 *
 */

var chaisePage = require('../../../utils/chaise.page.js');

describe('Chaise initial sidebar,', function () {

    var EC = protractor.ExpectedConditions;

    var spinner = element(by.id('spinner'));
    describe('when initializing,', function () {

        beforeAll(function () {
            browser.get(browser.params.url || "");
        });

        it('should show the spinner', function () {
            //so icon can be tested before everything settles down(settling down means img is no longer there)
            expect(spinner.isDisplayed()).toBe(true);
        });
    });

    describe('after initialization,', function () {

        var numOfAttrs, ranInt;
        it('should show the initial sidebar', function () {
            var sidebar = element(by.id('sidebar'));
            browser.wait(EC.visibilityOf(sidebar), 10000).then(function () {
                expect(sidebar.isDisplayed()).toBe(true);
            });
        });

        it('should have > 1 visible attributes to choose from', function () {
            chaisePage.sidebar.sidebarAttrsDisplayed.count().then(function (num) {
                numOfAttrs = num;
                ranInt = chaisePage.tools.getRandomInt(0, numOfAttrs - 1);
                expect(num).toBeGreaterThan(0);
            });
        });

        describe('sidebar header title,', function () {
            var initSidebarHeaderText = 'CHOOSE ATTRIBUTES';
            var sidebarHeader = chaisePage.sidebar.sidebarHeader;
            it('should show correctly when initialized', function () {
                expect(sidebarHeader.getText()).toBe(initSidebarHeaderText);
            });

            var expectedAttr;

            var sidebarAttrTitle = chaisePage.editFilter.sidebarHeader;

            it('should change correctly when one attribute is chosen', function () {
                expectedAttr = chaisePage.sidebar.sidebarAttrsDisplayed.get(ranInt);
                expectedAttr.click();
                expectedAttr.getText().then(function (txt) {
                    expect(sidebarAttrTitle.getText()).toBe(txt.toUpperCase());
                });
            });

            it('should change back to \'CHOOSE ATTRIBUTES\' when clicking GoBack icon', function () {
                var sidebarBack = chaisePage.editFilter.sidebarHeader;
                sidebarBack.click();
                expect(sidebarHeader.getText()).toBe(initSidebarHeaderText);
            });
        });


        it('should show attributes with top or facetOrder annotation initially', function () {
            var columns = chaisePage.dataUtils.sidebar.getAllVisibleSidebarColumns(browser.params.defaultSchema, browser.params.defaultTable);
            chaisePage.sidebar.getSidebarAttrsDisplayed().then(function(sidebarAttributes) {
                expect(sidebarAttributes.length).toBe(columns.length);
                if (columns.length > 0) {
                    columns.forEach(function(c) {
                        var displayedAttr = chaisePage.sidebar.findSidebarAttrVisibleByName(chaisePage.dataUtils.sidebar.getColumnDisplayName(c));
                        displayedAttr.isDisplayed().then(function(displayed) {
                            if (!displayed) console.log(chaisePage.dataUtils.sidebar.getColumnDisplayName(c) + " not displayed");
                            expect(displayed).toBe(true);
                        });
                    });
                }
            });
        });

        it('should not show attributes with bottom', function () {
            var columns = chaisePage.dataUtils.sidebar.getInvisibleSidebarColumns(browser.params.defaultSchema, browser.params.defaultTable);
            columns.forEach(function(column) {
                chaisePage.sidebar.isSidebarAttrDisplayed(chaisePage.dataUtils.sidebar.getColumnDisplayName(column)).then(function(displayed) {
                    if (displayed) console.log(chaisePage.dataUtils.sidebar.getColumnDisplayName(column) + " is displayed");
                    expect(displayed).toBe(false);
                });
            });
        });

        var viewAll = chaisePage.sidebar.viewMoreBtn;

        it('the number in the () should be consistent with the number of items displayed in the list under "View all attributes"', function () {
            var columns = chaisePage.dataUtils.sidebar.getAllSidebarColumns(browser.params.defaultSchema, browser.params.defaultTable);
            expect(viewAll.getText()).toBe("View all attributes (" + columns.length + ")");
        });

        var sidebarHeader = chaisePage.sidebar.sidebarHeader;
        var previousChecked, previousCheckedText, previousUnchecked, previousUncheckedText;

        describe('when entering \'View All Attributes\'', function () {
            it('sidebar header should change to \'view all attributes\'', function () {
                viewAll.click();
                expect(chaisePage.moreFilter.sidebarHeader.getText()).toContain('ALL ATTRIBUTES');
            });

            it('attributes with "top" and "facetOrder" annotations should only be checked', function() {
                var columns = chaisePage.dataUtils.sidebar.getAllVisibleSidebarColumns(browser.params.defaultSchema, browser.params.defaultTable);
                chaisePage.moreFilter.findAllCheckedAttrCheckbox().then(function(checkedAttrs) {
                    expect(checkedAttrs.length).toBe(columns.length);
                    for (var i=0; i < checkedAttrs.length; i++) {
                        browser.executeScript('return arguments[0].innerHTML;', checkedAttrs[i].getWebElement()).then(function(txt) {
                            txt = txt.trim();
                            var found = columns.find(function(c) {
                                return chaisePage.dataUtils.sidebar.getColumnDisplayName(c) == txt;
                            }) ? true : false;
                            expect(found).toBe(true);
                        });
                    }
                });
            });

            it('first checked attribute name should be defined', function () {
                previousChecked = chaisePage.moreFilter.findFirstCheckedAttrCheckBox();
                previousChecked.getText().then(function (txt) {
                    expect(txt).toBeDefined();
                    previousCheckedText = txt;
                });
            });

            it('first unchecked attribute name should be defined', function () {
                previousUnchecked = chaisePage.moreFilter.findFirstUncheckedAttrCheckBox();
                previousUnchecked.getText().then(function (txt) {
                    expect(txt).toBeDefined();
                    previousUncheckedText = txt;
                });
            });

        });

        var previousCheckedAttr, previousUncheckedAttr;
        describe('when back to initial sidebar', function () {
            it('sidebar header should show \'CHOOSE ATTRIBUTES\'', function () {
                chaisePage.moreFilter.goBackToSidebar();
                expect(sidebarHeader.getText()).toBe('CHOOSE ATTRIBUTES');
            });

            it('should show previously checked attribute', function () {
                chaisePage.sidebar.isSidebarAttrDisplayed(previousCheckedText).then(function(displayed) {
                    if (!displayed) console.log(previousCheckedText + " is not displayed");
                    expect(displayed).toBe(true);
                });
            });

            it('should not show previously unchecked attribute', function () {
                chaisePage.sidebar.isSidebarAttrDisplayed(previousUncheckedText).then(function(displayed) {
                    if (displayed) console.log(previousUncheckedText + " is displayed");
                    expect(displayed).toBe(false);
                });
            });

            it('should entering \'View All Attributes\', check previously unchecked and uncheck ' +
                'previously checked', function () {
                viewAll.click();
                chaisePage.moreFilter.clickMorefilterAttrByName(previousCheckedText);
                chaisePage.moreFilter.clickMorefilterAttrByName(previousUncheckedText);
                browser.sleep(100);
                chaisePage.moreFilter.goBackToSidebar();
            });
            it('should show previously unchecked attribute', function () {
                chaisePage.sidebar.isSidebarAttrDisplayed(previousCheckedText).then(function(displayed) {
                    if (displayed) console.log(previousCheckedText + " is displayed");
                    expect(displayed).toBe(false);
                });
            });
            it('should not show previously checked attribute', function () {
                chaisePage.sidebar.isSidebarAttrDisplayed(previousUncheckedText).then(function(displayed) {
                    expect(displayed).toBe(true);
                });
            });

        });
    });

});
