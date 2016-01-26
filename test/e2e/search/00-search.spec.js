/**
 *
 * Created by shuai.
 *
 * Test the initial sidebar.
 *
 */

var chaisePage = require('../chaise.page.js');
describe('In Chaise, search_00 sidebar', function() {
    var EC = protractor.ExpectedConditions;
    describe('on load,', function () {
        beforeAll(function () {
            browser.get('');
        });

        it('should show the spinner', function (done) {
            //not so sure why adding ignoreSync works
            //probably not waiting for AngularJS to sync,
            //so icon can be tested before everything settles down(settling down means img is no longer there)
            browser.ignoreSynchronization = true;
            var spinner = element(by.id('spinner'));
            expect(spinner.isDisplayed()).toBe(true);
            done();
        });

        it('should open the initial sidebar', function (done) {
            browser.ignoreSynchronization = false;
            var spinner = element(by.id('spinner'));
            var sidebar = element(by.id('sidebar'));
            browser.wait(EC.visibilityOf(sidebar), 10000).then(function () {
                expect(sidebar.isDisplayed()).toBe(true);
                expect(spinner.isDisplayed()).toBe(false);
                done();
            });
        });

    });

    describe('the initial attributes selection sidebar,', function () {
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

        describe('sidebar attribute,', function () {
            var somiteCount = 'Somite Count';
            var investigator = 'Investigator';
            var somiteCountAttr = chaisePage.sidebar.findSidebarAttrByName(somiteCount);
            var investigatorAttr = chaisePage.sidebar.findSidebarAttrByName(investigator);

            it('Somite Count attribute should be displayed', function (done) {
                expect(somiteCountAttr.isDisplayed()).toBe(true);
                done();
            });

            it('Investigator attribute should not be displayed', function (done) {
                expect(investigatorAttr.isDisplayed()).toBe(false);
                done();
            });

            it('should show Investigator and hide Somite Count after checking and unchecking', function (done) {
                var viewAll = chaisePage.sidebar.viewMoreBtn;
                var investigatorCheckbox = chaisePage.moreFilter.findMorefilterAttrByName(investigator);
                var somiteCountCheckbox = chaisePage.moreFilter.findMorefilterAttrByName(somiteCount);

                var sidebarHeader = chaisePage.moreFilter.sidebarHeader;
                //click to show all attributes' checkboxs
                viewAll.click();
                investigatorCheckbox.click();
                somiteCountCheckbox.click();
                //click GoBack to see attribute list
                sidebarHeader.click();
                expect(somiteCountAttr.isDisplayed()).toBe(false);
                expect(investigatorAttr.isDisplayed()).toBe(true);
                done();
            });
        });
    });

});
