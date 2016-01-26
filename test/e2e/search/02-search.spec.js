/**
 * Created by shuai on 1/25/16.
 *
 * Test the sidebar filter (Summary and Description)
 *
 */

var chaisePage = require('../chaise.page.js');
describe('In Chaise, search_02 sidebarFilter summary and description,', function () {
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
            done();
        });

        it('should open the initial sidebar', function (done) {
            browser.ignoreSynchronization = false;
            var spinner = element(by.id('spinner'));
            var sidebar = element(by.id('sidebar'));
            browser.wait(EC.visibilityOf(sidebar), 10000).then(function () {
                done();
            });
        });

    });

    describe('The sidebar filter input,', function () {
        var searchBox = chaisePage.sidebar.searchInput;

        it('should search \'RNA\' in the search input', function (done) {
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
                        }, 4000);
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

    describe('The sidebar \'Summary\' filtered records,', function() {
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

        //randomly choose a record
        //var summaryText = '';
        //var titleText = '';
        //it('the picked record\' summary should be displayed', function (done) {
        //    var titleSpan = chaisePage.resultContent.resultAllRows.get(randomIdx).$('span.panel-title');
        //    var summaryEle = chaisePage.resultContent.resultAllRows
        //        .get(randomIdx).$('.panel-body div[ng-show="values\[\'summary\'\]!=null"] dd');
        //    titleSpan.getText().then(function (titleTxt) {
        //        //get the entity title in results list
        //        summaryEle.getText().then(function(summaryTxt) {
        //            titleText = titleTxt;
        //            summaryText = summaryTxt;
        //            done();
        //        });
        //    });
        //});

        var summaryFilter = chaisePage.sidebar.findSidebarAttrByName('Summary');
        var editFilterEle = chaisePage.editFilter.htmlElement;
        var summaryInput = editFilterEle.$('input');
        it('should input some meaningless text in summary input', function(done) {
            summaryFilter.click().then(function() {
                summaryInput.sendKeys('hellomyfriend');
                summaryInput.sendKeys(protractor.Key.ENTER);
                setTimeout(function () {
                    done();
                }, 4000);
            });
        });

        it('should show 0 record when searching meaningless summary filter input', function(done) {
            var num = chaisePage.resultContent.resultAllRows;
            expect(num.count()).toBe(0);
            summaryInput.clear();
            //use keystroke to activate AJAX to refresh page
            summaryInput.sendKeys(protractor.Key.ENTER);
            setTimeout(function() {
                done();
            }, 5000);
        });

        it('should show >0 records when clearing the summary filter input', function(done) {
            var num = chaisePage.resultContent.resultAllRows;
            expect(num.count()).toBeGreaterThan(0);
            var editHeader = chaisePage.editFilter.sidebarHeader;
            editHeader.click();
            done();
        });

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
