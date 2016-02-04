/**
 * Created by shuai on 1/25/16.
 *
 * Test the sidebar filter (Summary and Description)
 *
 */

var chaisePage = require('../chaise.page.js');
var pageAction = require('../page.action.js');

describe('In Chaise, search_02 sidebarFilter description,', function () {
    var EC = protractor.ExpectedConditions;

    describe('on load,', function () {
        it('should load the page', function (done) {
            pageAction.loadChaise();
            done();
        });
    });

    describe('The sidebar filter input,', function () {
        var searchBox = chaisePage.sidebar.searchInput;

        it('should enter \'RNA\' in the search input', function (done) {
            browser.wait(EC.visibilityOf(searchBox), 500).then(function () {
                searchBox.clear();
                searchBox.sendKeys('RNA');
                done();
            });
        });

        it('should check \'RNA expression (microarray)\' in \'Experiment Type\'', function(done) {
            var experimentType = 'Experiment Type';
            var experimentFacet = chaisePage.sidebar.findSidebarAttrByName(experimentType);
            browser.wait(EC.visibilityOf(experimentFacet), 500).then(function () {
                experimentFacet.click();
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

        it('should go back to initial sidebar', function(done) {
            var editGobackBtn = chaisePage.editFilter.sidebarHeader;
            editGobackBtn.click();
            done();
        });
    });

    describe('The sidebar \'Description\' filtered records,', function() {
        var randomIdx = 0;
        var recordSumBefore = 0;
        it('records\' number should be >0 and a random record is picked', function(done) {
            var tallyRange = chaisePage.resultContent.resultTallyRange;
            var tallySum = chaisePage.resultContent.resultTallySum;
            expect(tallyRange.getText()).toContain('-');
            tallyRange.getText().then(function(range) {
                var sum = chaisePage.tools.getDisplayedRecordNum(range);
                expect(sum).not.toBe(0);
                randomIdx = chaisePage.tools.getRandomInt(1, sum);
                tallySum.getText().then(function(txt) {
                    recordSumBefore = parseInt(txt);
                    done();
                });
            });
        });

        var editFilterEle = chaisePage.editFilter.htmlElement;
        var descriptionFilter = chaisePage.sidebar.findSidebarAttrByName('Description');
        var descriptionInput = editFilterEle.$('input');
        it('should show 0 record when inputing meaningless text in description', function(done) {
            descriptionFilter.click();
            descriptionInput.sendKeys('helloagain');
            descriptionInput.sendKeys(protractor.Key.ENTER);
            var num = chaisePage.resultContent.resultAllRows;
            expect(num.count()).toBe(0);
            done();
        });

    });

});
