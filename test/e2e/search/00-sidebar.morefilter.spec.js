/**
 *
 * Created by shuai.
 *
 * Test the initial sidebar.
 * Checking attributes in View all attributes will show them in initial sidebar list.
 *
 */

var chaisePage = require('../chaise.page.js');

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
            var initSidebarHeaderText = 'CHOOSE ATTRIBUTES:';
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

        //previously displayed attribute
        var somiteCount = 'Somite Count';
        //previously non-displayed attribute
        var nonDisplayedAttrName = 'Title';


        var somiteCountAttr = chaisePage.sidebar.findSidebarAttrByName(somiteCount);
        var nonDisplayedAttr = chaisePage.sidebar.findSidebarAttrByName(nonDisplayedAttrName);
        it('should show \'Somite Count\' attribute', function () {
            expect(somiteCountAttr.isDisplayed()).toBe(true);
        });

        it('should not show \'' + nonDisplayedAttrName + '\' attribute', function () {
            expect(nonDisplayedAttr.isDisplayed()).toBe(false);
        });

        var viewAll = chaisePage.sidebar.viewMoreBtn;
        var sidebarHeader = chaisePage.sidebar.sidebarHeader;
        var previousChecked, previousCheckedText, previousUnchecked, previousUncheckedText;
        describe('when entering \'View All Attributes\'', function () {
            it('sidebar header should change to \'view all attributes\'', function () {
                viewAll.click();
                expect(chaisePage.moreFilter.sidebarHeader.getText()).toContain('ALL ATTRIBUTES');
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
            it('sidebar header should show \'CHOOSE ATTRIBUTES:\'', function () {
                chaisePage.moreFilter.goBackToSidebar();
                expect(sidebarHeader.getText()).toBe('CHOOSE ATTRIBUTES:');
            });

            it('should show previously checked attribute', function () {
                previousCheckedAttr = chaisePage.sidebar.findSidebarAttrByName(previousCheckedText);
                expect(previousCheckedAttr.isDisplayed()).toBe(true);
            });

            it('should not show previously unchecked attribute', function () {
                previousUncheckedAttr = chaisePage.sidebar.findSidebarAttrByName(previousUncheckedText);
                expect(previousUncheckedAttr.isDisplayed()).toBe(false);
            });
            it('should entering \'View All Attributes\', check previously unchecked and uncheck' +
                'previously checked', function () {
                viewAll.click();
                chaisePage.moreFilter.findMorefilterAttrByName(previousCheckedText).click();
                chaisePage.moreFilter.findMorefilterAttrByName(previousUncheckedText).click();
                chaisePage.moreFilter.goBackToSidebar();
            });
            it('should show previously unchecked attribute', function () {
                previousCheckedAttr = chaisePage.sidebar.findSidebarAttrByName(previousCheckedText);
                expect(previousCheckedAttr.isDisplayed()).toBe(false);
            });
            it('should not show previously checked attribute', function () {
                previousUncheckedAttr = chaisePage.sidebar.findSidebarAttrByName(previousUncheckedText);
                expect(previousUncheckedAttr.isDisplayed()).toBe(true);
            });

        });
    });

});
