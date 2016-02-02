/**
 * Created by shuai on 1/25/16.
 *
 * Test the sidebar filter in #editfilter and #morefilters,
 * the filter tags in content area
 *
 */

var chaisePage = require('../chaise.page.js');
var pageAction = require('../page.action.js');

xdescribe('In Chaise, search_01 contentArea and sidebar', function () {
    var EC = protractor.ExpectedConditions;

    describe('on load,', function () {
        it('should load the page', function (done) {
            pageAction.loadChaise();
            done();
        });
    });

    describe('The sidebar filter input', function () {
        var searchBox = chaisePage.sidebar.searchInput;
        var displayedAttrs = chaisePage.sidebar.sidebarAttrsDisplayed;
        it('should display 0 attributes when searching for something nonexistent', function (done) {
            browser.wait(EC.visibilityOf(searchBox), 500).then(function () {
                // Set values (usually inputs) via sendKeys();
                searchBox.sendKeys('hellogoodbye');
            });
            expect(displayedAttrs.count()).toBe(0);
            done();
        });

        it('should find >= 0 attributes when searching for \'RNA\' in the search box', function (done) {
            browser.wait(EC.visibilityOf(searchBox), 500).then(function () {
                searchBox.clear();
                searchBox.sendKeys('RNA');
            });
            expect(displayedAttrs.count()).toBeGreaterThan(0);
            done();
        });

        it('should show >= 0 editfilter attributes after clicking \"Experiment Type\"', function (done) {
            var searchBoxInput = searchBox.getAttribute('value');
            expect(searchBoxInput).toBe('RNA');

            var experimentType = 'Experiment Type';
            var experimentFacet = chaisePage.sidebar.findSidebarAttrByName(experimentType);
            experimentFacet.click();
            var displayedEditAttrs = chaisePage.editFilter.displayedEditAttrs;
            expect(displayedEditAttrs.count()).toBeGreaterThan(0);
            done();
        });

        it('should find \'RNA express (microarray)\', click it and wait for 5s', function (done) {
            var editFilterName = 'RNA expression (microarray)';
            var filterLabel = chaisePage.editFilter.findEditfilterAttrByName(editFilterName);
            browser.wait(EC.visibilityOf(filterLabel), 500).then(function () {
                filterLabel.click().then(function () {
                    setTimeout(function () {
                        done();
                    }, 5000);
                });
            });
        });
    });

    describe('Result content area,', function () {
        it('should show > 0 results', function (done) {
            var allResultRows = chaisePage.resultContent.resultAllRows;
            var totalResultTallyShows = chaisePage.resultContent.resultTallySum;
            expect(allResultRows.count()).toBeGreaterThan(0);
            totalResultTallyShows.getText().then(function(txt) {
                expect(parseInt(txt)).toBeGreaterThan(0);
                done();
            });
        });

        //input is now "RNA"
        var experimentType = 'Experiment Type';
        var microArrayText = 'RNA expression (microarray)';
        var experimentTypeWrapper = chaisePage.resultContent.filter.findFilterWrapperByName(experimentType);
        var experimentTypeSpans = experimentTypeWrapper.all(by.css('span.filter-item-value span'));
        it('should show \'Clear All Filters\' button and \'Experiment Type\' filter', function (done) {
            var clearAllFilterBtn = chaisePage.resultContent.filter.clearAllBtn;
            expect(clearAllFilterBtn.isDisplayed()).toBe(true);
            var displayedFilters = chaisePage.resultContent.filter.displayedFilters;
            //now only "Clear All Filters" and "Experiment Type" are shown (so 2 elements are expected)
            expect(experimentTypeWrapper.isDisplayed()).toBe(true);
            expect(displayedFilters.count()).toBe(2);
            expect(experimentTypeSpans.count()).toBe(1);
            done();
        });

        var miRNAText = 'miRNA expression (RNA-Seq)';
        it('should show click \'miRNA expression\' in \'Experiment Type\'', function(done) {
            var filterLabel = chaisePage.editFilter.findEditfilterAttrByName(miRNAText);
            browser.wait(EC.visibilityOf(filterLabel), 500).then(function () {
                filterLabel.click().then(function () {
                    setTimeout(function () {
                        done();
                    }, 5000);
                });
            });
        });

        it('should show \'miRNA expression\' in \'Experiment Type\' filter span after checking \'miRNA\'', function(done) {
            //the span now contains 'miRNA expression (RNA-Seq)' and 'RNA expression (microarray)'
            var miRNASpan = experimentTypeWrapper.element(by.cssContainingText('span.ng-binding.ng-scope', miRNAText));
            miRNASpan.getText().then(function(txt) {
                expect(txt).toContain(miRNAText);
                done();
            });
        });


        var externalReferenceText = 'External Reference';
        it('should go back and check \'Genome Browser reference\' in \'External Reference\'', function(done) {
            var goback = chaisePage.editFilter.sidebarHeader;
            goback.click();
            var externalArr = chaisePage.sidebar.findSidebarAttrsByName(externalReferenceText);
            var external = externalArr.filter(function(ele) {
                return ele.getText().then(function(t) {
                    return t === externalReferenceText;
                });
            }).first();
            expect(external.isDisplayed()).toBe(true);
            var genomeAttr = chaisePage.editFilter.findEditfilterAttrByName('Genome Browser reference');
            external.click();
            expect(genomeAttr.isDisplayed()).toBe(true);
            genomeAttr.click();
            //goback
            goback.click();
            done();
        });

        it('should show \'External Reference\' filter', function(done) {
            var externalFilter = chaisePage.resultContent.filter.findFilterWrapperByName(externalReferenceText);
            expect(externalFilter.isDisplayed()).toBe(true);
            done();
        });

        it('should uncheck \'RNA expression(microArray)\' click on \'Experiment Type\' Cancel icon', function(done) {
            var cancelBtn = experimentTypeWrapper.element(by.css('.filter-link-cancel'));
            var experimentTypeAttr = chaisePage.sidebar.findSidebarAttrByName(experimentType);
            experimentTypeAttr.click();
            var microArrayLi = chaisePage.editFilter.findEditfilterLiByName(microArrayText);
            var checkbox = microArrayLi.element(by.css('div[ng-click="sideBar.checkUncheck($event,value)"'));
            expect(checkbox.getAttribute('class')).toMatch('toggle');
            expect(checkbox.getAttribute('class')).not.toMatch('disabled');
            cancelBtn.click().then(function() {
                expect(checkbox.getAttribute('class')).toMatch('toggle disabled');
                done();
            });
        });

    });
});
