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
            //not so sure why adding ignoreSync works
            //probably not waiting for AngularJS to sync,
            //so icon can be tested before everything settles down(settling down means img is no longer there)
            browser.ignoreSynchronization = true;
            expect(spinner.isDisplayed()).toBe(true);
        });
    });

    describe('after initialization completes,', function () {
        it('should show the initial sidebar', function () {
            browser.ignoreSynchronization = false;
            var sidebar = element(by.id('sidebar'));
            browser.wait(EC.visibilityOf(sidebar), 10000).then(function () {
                expect(sidebar.isDisplayed()).toBe(true);
            });
        });
        it('should not show the spinner', function () {
            expect(spinner.isDisplayed()).toBe(false);
        });
        it('should have > 1 visible attributes to choose from', function () {
            expect(chaisePage.sidebar.sidebarAttrsDisplayed.count()).toBeGreaterThan(0);
        });

        describe('sidebar header title,', function () {
            var initSidebarHeaderText = 'CHOOSE ATTRIBUTES:';
            var sidebarHeader = chaisePage.sidebar.sidebarHeader;
            it('should show correctly when initialized', function () {
                expect(sidebarHeader.getText()).toBe(initSidebarHeaderText);
            });

            var expectedAttr = 'Data Type';
            var dataTypeAttr = chaisePage.sidebar.findSidebarAttrByName(expectedAttr);
            var sidebarAttrTitle = chaisePage.editFilter.sidebarHeader;

            it('should change correctly when one attribute is chosen', function () {
                dataTypeAttr.click();
                expect(sidebarAttrTitle.getText()).toBe(expectedAttr.toUpperCase());
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
        describe('when entering \'View All Attributes\'', function () {
            it('sidebar header should change to \'view all attributes\'', function () {
                viewAll.click();
                expect(chaisePage.moreFilter.sidebarHeader.getText()).toContain('ALL ATTRIBUTES');
            });

            it('should check \'' + nonDisplayedAttrName + '\' and uncheck \'Somite Count\'', function () {
                var nonDisplayedAttrCheckbox = chaisePage.moreFilter.findMorefilterAttrByName(nonDisplayedAttrName);
                var somiteCountCheckbox = chaisePage.moreFilter.findMorefilterAttrByName(somiteCount);
                nonDisplayedAttrCheckbox.click();
                somiteCountCheckbox.click();
            });

        });

        describe('when back to initial sidebar', function () {
            it('sidebar header should show \'CHOOSE ATTRIBUTES:\'', function () {
                chaisePage.moreFilter.goBackToSidebar();
                expect(sidebarHeader.getText()).toBe('CHOOSE ATTRIBUTES:');
            });

            it('should show \'Investigator\' attribute', function () {
                expect(nonDisplayedAttr.isDisplayed()).toBe(true);
            });

            it('should not show \'Somite Count\' attribute', function () {
                expect(somiteCountAttr.isDisplayed()).toBe(false);
            });

        });
    });

});
