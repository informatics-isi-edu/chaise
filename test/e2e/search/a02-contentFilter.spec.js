/**
 * Created by shuai on 2/2/16.
 */
var chaisePage = require('../chaise.page.js');
var pageAction = require('../page.action.js');
var filterObj = chaisePage.resultContent.filter;

xdescribe('Filters on top of the records,', function () {
    var EC = protractor.ExpectedConditions;

    it('should load the page correctly', function (done) {
        pageAction.loadChaise();
        done();
    });

    describe('', function () {
        var experimentTypeText = 'Experiment Type';
        var microarrayText = 'RNA expression (microarray)';

        chaisePage.sidebar.clickSidebarAttr(experimentTypeText);
        chaisePage.editFilter.clickEditFilter(microarrayText);

        it('should show the \'Clear All Filters\' button', function (done) {
            var clearAllBtn = filterObj.clearAllBtn;
            expect(clearAllBtn.isDisplayed()).toBe(true);
            done();
        });

        it('should show \'RNA expression (microarray)\' wrapper', function (done) {
            var microWrapper = filterObj.findFilterWrapperByName(experimentTypeText);
            expect(microWrapper.isDisplayed()).toBe(true);
            done();
        });

        it('should show 1 edit filter in \'RNA expression (microarray)\' wrapper', function (done) {
            var subFilters = filterObj.findCheckedSubfiltersByName(experimentTypeText);
            expect(subFilters.count()).toBe(1);
            done();
        });

    });


});
