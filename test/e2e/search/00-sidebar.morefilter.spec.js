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
            browser.get('');
        });

        it('should show the spinner', function (done) {
            //not so sure why adding ignoreSync works
            //probably not waiting for AngularJS to sync,
            //so icon can be tested before everything settles down(settling down means img is no longer there)
            browser.ignoreSynchronization = true;
            expect(spinner.isDisplayed()).toBe(true);
            done();
        });
    });

    describe('after initialization completes,', function () {
        it('should show the initial sidebar', function (done) {
            browser.ignoreSynchronization = false;
            var sidebar = element(by.id('sidebar'));
            browser.wait(EC.visibilityOf(sidebar), 10000).then(function () {
                expect(sidebar.isDisplayed()).toBe(true);
                done();
            });
        });
        it('should not show the spinner', function (done) {
            expect(spinner.isDisplayed()).toBe(false);
            done();
        });
        it('should have > 1 visible attributes to choose from', function (done) {
            expect(chaisePage.sidebar.sidebarAttrsDisplayed.count()).toBeGreaterThan(0);
            done();
        });

        describe('sidebar header title,', function () {
            var initSidebarHeaderText = 'CHOOSE ATTRIBUTES:';
            var sidebarHeader = chaisePage.sidebar.sidebarHeader;
            it('should show correctly when initialized', function (done) {
                expect(sidebarHeader.getText()).toBe(initSidebarHeaderText);
                done();
            });

            var expectedAttr = 'Data Type';
            var dataTypeAttr = chaisePage.sidebar.findSidebarAttrByName(expectedAttr);
            var sidebarAttrTitle = chaisePage.editFilter.sidebarHeader;

            it('should change correctly when one attribute is chosen', function (done) {
                dataTypeAttr.click().then(function () {
                    expect(sidebarAttrTitle.getText()).toBe(expectedAttr.toUpperCase());
                    done();
                });
            });

            it('should change back to \'CHOOSE ATTRIBUTES\' when clicking GoBack icon', function (done) {
                var sidebarBack = chaisePage.editFilter.sidebarHeader;
                sidebarBack.click().then(function () {
                    expect(sidebarHeader.getText()).toBe(initSidebarHeaderText);
                    done();
                });
            });
        });

        //previously displayed attribute
        var somiteCount = 'Somite Count';
        //previously non-displayed attribute
        var investigator = 'Investigator';

        var somiteCountAttr = chaisePage.sidebar.findSidebarAttrByName(somiteCount);
        var investigatorAttr = chaisePage.sidebar.findSidebarAttrByName(investigator);
        it('should show \'Somite Count\' attribute', function (done) {
            expect(somiteCountAttr.isDisplayed()).toBe(true);
            done();
        });

        it('should not show \'Investigator\' attribute', function (done) {
            expect(investigatorAttr.isDisplayed()).toBe(false);
            done();
        });

        var viewAll = chaisePage.sidebar.viewMoreBtn;
        var sidebarHeader = chaisePage.sidebar.sidebarHeader;
        describe('when entering \'View All Attributes\'', function () {
            it('sidebar header should change to \'view all attributes\'', function (done) {
                viewAll.click();
                expect(chaisePage.moreFilter.sidebarHeader.getText()).toContain('ALL ATTRIBUTES');
                done();
            });

            it('should check \'Investigator\' and uncheck \'Somite Count\'', function (done) {
                var investigatorCheckbox = chaisePage.moreFilter.findMorefilterAttrByName(investigator);
                var somiteCountCheckbox = chaisePage.moreFilter.findMorefilterAttrByName(somiteCount);
                investigatorCheckbox.click();
                somiteCountCheckbox.click();
                done();
            });

        });

        describe('when back to initial sidebar', function () {
            it('sidebar header should show \'CHOOSE ATTRIBUTES:\'', function (done) {
                chaisePage.moreFilter.goBackToSidebar();
                expect(sidebarHeader.getText()).toBe('CHOOSE ATTRIBUTES:');
                done();
            });

            it('should show \'Investigator\' attribute', function (done) {
                expect(investigatorAttr.isDisplayed()).toBe(true);
                done();
            });

            it('should not show \'Somite Count\' attribute', function (done) {
                expect(somiteCountAttr.isDisplayed()).toBe(false);
                done();
            });

        });
    });

});
