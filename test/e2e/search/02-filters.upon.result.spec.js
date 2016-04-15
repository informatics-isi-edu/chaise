/**
 * Created by shuai on 2/2/16.
 */
var chaisePage = require('../chaise.page.js');
var filterObj = chaisePage.resultContent.filter;

xdescribe('Filters on top of the records,', function () {
    var EC = protractor.ExpectedConditions;

    beforeAll(function (done) {
        browser.get('');
        var sidebar = element(by.id('sidebar'));
        browser.wait(EC.visibilityOf(sidebar), 10000).then(function () {
            done();
        });
    });
    var experimentTypeText = 'Experiment Type';
    var microarrayText = 'RNA expression (microarray)';
    var enhancerRepText = 'Enhancer reporter gene assay';
    var proteinExpText = 'Protein expression data';
    var expeSubfilters = filterObj.findCheckedSubfiltersByName(experimentTypeText);

    describe('after checking 1 edit filter (\'RNA expression microarray\' in \'Experiment Type\'),', function () {
        it('should show the \'Clear All Filters\' button', function () {
            chaisePage.sidebar.clickSidebarAttr(experimentTypeText);
            chaisePage.editFilter.clickEditFilter(microarrayText);
            var clearAllBtn = filterObj.clearAllBtn;
            expect(clearAllBtn.isDisplayed()).toBe(true);
        });

        it('should show \'Experiment Type\' wrapper', function () {
            var microWrapper = filterObj.findFilterWrapperByName(experimentTypeText);
            expect(microWrapper.isDisplayed()).toBe(true);
        });

        it('should show 1 edit filter in \'Experiment Type\' wrapper', function () {
            expect(expeSubfilters.count()).toBe(1);
        });

        it('should show \'RNA expression microarray\' in \'Experiment Type\' wrapper', function () {
            var title = filterObj.findFitlerWrapperTitleByWrapperName(experimentTypeText);
            expect(title).toContain(microarrayText);
        });
    });

    var microArrStatus = chaisePage.editFilter.findCheckStatusDivByName(microarrayText);
    var enhancerStatus = chaisePage.editFilter.findCheckStatusDivByName(enhancerRepText);
    var proteinStatus = chaisePage.editFilter.findCheckStatusDivByName(proteinExpText);
    it('should show 3 edit filters in \'Experiment Type\' wrapper ' +
        'after 2 more edit filters are checked', function () {
        chaisePage.editFilter.clickEditFilter(enhancerRepText);
        chaisePage.editFilter.clickEditFilter(proteinExpText);
        expect(microArrStatus.getAttribute('class')).not.toContain('disabled');
        expect(expeSubfilters.count()).toBe(3);
    });

    it('should uncheck edit filters when cancel is clicked', function () {
        filterObj.clickFilterWrapperCancelByName(experimentTypeText);
        chaisePage.customExpect.elementContainClass(microArrStatus, 'disabled');
        chaisePage.customExpect.elementContainClass(enhancerStatus, 'disabled');
        chaisePage.customExpect.elementContainClass(proteinStatus, 'disabled');
    });

    it('should check \'Enhancer reporter gene assay\' and go back to initial sidebar', function () {
        chaisePage.editFilter.clickEditFilter(enhancerRepText);
        chaisePage.editFilter.goBackToSidebar();
        expect(chaisePage.sidebar.sidebarHeader.isDisplayed()).toBe(true);
        expect(chaisePage.editFilter.sidebarHeader.getText()).toBe('');
    });

    var dataTypeText = 'Data Type';
    var optImgText = 'OPT images';

    it('should show 2 filter wrappers after \'OPT images\' in \'Data Type\' is checked', function () {
        chaisePage.sidebar.clickSidebarAttr(dataTypeText);
        chaisePage.editFilter.clickEditFilter(optImgText);
        //Experiment Type, Data Type, Clear All Filters add up to 3
        expect(filterObj.displayedFilters.count()).toBe(3);
    });

    describe('after \'Clear All Filters\' is clicked', function () {
        it('should show 0 filter wrappers and go back to initial sidebar', function () {
            filterObj.clickClearAllBtn();
            expect(filterObj.displayedFilters.count()).toBe(0);
        });

        it('should show correct initial sidebar header', function () {
            expect(chaisePage.sidebar.sidebarHeader.getText()).toBe('CHOOSE ATTRIBUTES:');
        });

        it('should have unchecked \'enhancer Reporter\' edit filter in \'Experiment Type\'', function () {
            chaisePage.sidebar.clickSidebarAttr(experimentTypeText);
            var enhancerStatus = chaisePage.editFilter.findCheckStatusDivByName(enhancerRepText);
            chaisePage.customExpect.elementContainClass(enhancerStatus, 'disabled');
        });

        it('should have unchecked \'OPT images\' in \'Data Type\'', function () {
            chaisePage.editFilter.goBackToSidebar();
            chaisePage.sidebar.clickSidebarAttr(dataTypeText);
            var optImgStatus = chaisePage.editFilter.findCheckStatusDivByName(optImgText);
            chaisePage.customExpect.elementContainClass(optImgStatus, 'disabled');
        });
    });

});
