/**
 * Created by shuai on 2/2/16.
 */
var chaisePage = require('../chaise.page.js');
var pageAction = require('../page.action.js');
var filterObj = chaisePage.resultContent.filter;

describe('Filters on top of the records,', function () {
    var EC = protractor.ExpectedConditions;

    it('should load the page correctly', function (done) {
        pageAction.loadChaise();
        done();
    });

    var experimentTypeText = 'Experiment Type';
    var microarrayText = 'RNA expression (microarray)';
    var enhancerRepText = 'Enhancer reporter gene assay';
    var proteinExpText = 'Protein expression data';
    var expeSubfilters = filterObj.findCheckedSubfiltersByName(experimentTypeText);

    describe('after checking 1 edit filter (\'RNA expression microarray\' in \'Experiment Type\'),', function () {
        it('should show the \'Clear All Filters\' button', function (done) {
            chaisePage.sidebar.clickSidebarAttr(experimentTypeText);
            chaisePage.editFilter.clickEditFilter(microarrayText);
            var clearAllBtn = filterObj.clearAllBtn;
            expect(clearAllBtn.isDisplayed()).toBe(true);
            done();
        });

        it('should show \'Experiment Type\' wrapper', function (done) {
            var microWrapper = filterObj.findFilterWrapperByName(experimentTypeText);
            expect(microWrapper.isDisplayed()).toBe(true);
            done();
        });

        it('should show 1 edit filter in \'Experiment Type\' wrapper', function (done) {
            expect(expeSubfilters.count()).toBe(1);
            done();
        });

        it('should show \'RNA expression microarray\' in \'Experiment Type\' wrapper', function (done) {
            var title = filterObj.findFitlerWrapperTitleByWrapperName(experimentTypeText);
            expect(title).toContain(microarrayText);
            done();
        });
    });

    var microArrStatus = chaisePage.editFilter.findCheckStatusDivByName(microarrayText);
    var enhancerStatus = chaisePage.editFilter.findCheckStatusDivByName(enhancerRepText);
    var proteinStatus = chaisePage.editFilter.findCheckStatusDivByName(proteinExpText);
    it('should show 3 edit filters in \'Experiment Type\' wrapper ' +
        'after 2 more edit filters are checked', function (done) {
        chaisePage.editFilter.clickEditFilter(enhancerRepText);
        chaisePage.editFilter.clickEditFilter(proteinExpText);
        expect(microArrStatus.getAttribute('class')).not.toContain('disabled');
        expect(expeSubfilters.count()).toBe(3);
        done();
    });

    it('should uncheck edit filters when cancel is clicked', function (done) {
        filterObj.clickFilterWrapperCancelByName(experimentTypeText);
        chaisePage.customExpect.elementContainClass(microArrStatus, 'disabled');
        chaisePage.customExpect.elementContainClass(enhancerStatus, 'disabled');
        chaisePage.customExpect.elementContainClass(proteinStatus, 'disabled');
        done();
    });

    it('should check \'Enhancer reporter gene assay\' and go back to initial sidebar', function (done) {
        chaisePage.editFilter.clickEditFilter(enhancerRepText);
        chaisePage.editFilter.goBackToSidebar();
        expect(chaisePage.sidebar.sidebarHeader.isDisplayed()).toBe(true);
        expect(chaisePage.editFilter.sidebarHeader.getText()).toBe('');
        done();
    });

    var dataTypeText = 'Data Type';
    var optImgText = 'OPT images';

    it('should show 2 filter wrappers after \'OPT images\' in \'Data Type\' is checked', function (done) {
        chaisePage.sidebar.clickSidebarAttr(dataTypeText);
        chaisePage.editFilter.clickEditFilter(optImgText);
        //Experiment Type, Data Type, Clear All Filters add up to 3
        expect(filterObj.displayedFilters.count()).toBe(3);
        done();
    });

    describe('after \'Clear All Filters\' is clicked', function () {
        it('should show 0 filter wrappers and go back to initial sidebar', function (done) {
            filterObj.clickClearAllBtn();
            expect(filterObj.displayedFilters.count()).toBe(0);
            done();
        });

        it('should show correct initial sidebar header', function (done) {
            expect(chaisePage.sidebar.sidebarHeader.getText()).toBe('CHOOSE ATTRIBUTES:');
            done();
        });

        it('should have unchecked \'enhancer Reporter\' edit filter in \'Experiment Type\'', function (done) {
            chaisePage.sidebar.clickSidebarAttr(experimentTypeText);
            var enhancerStatus = chaisePage.editFilter.findCheckStatusDivByName(enhancerRepText);
            chaisePage.customExpect.elementContainClass(enhancerStatus, 'disabled');
            done();
        });

        it('should have unchecked \'OPT images\' in \'Data Type\'', function (done) {
            chaisePage.editFilter.goBackToSidebar();
            chaisePage.sidebar.clickSidebarAttr(dataTypeText);
            var optImgStatus = chaisePage.editFilter.findCheckStatusDivByName(optImgText);
            chaisePage.customExpect.elementContainClass(optImgStatus, 'disabled');
            done();
        });
    });

});
