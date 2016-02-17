var chaisePage = require('../chaise.page.js');
var pageAction = require('../page.action.js');

describe('Search result columns,', function () {
    var EC = protractor.ExpectedConditions;

    it('should load the page correctly', function (done) {
        pageAction.loadChaise();
        done();
    });

    //var randomSidebarAttrName = "";
    it('should click one sidebar attribute randomly', function (done) {
        var allAttrs = chaisePage.sidebar.sidebarAttrsDisplayed;
        allAttrs.count().then(function (num) {
            var ranInt = chaisePage.tools.getRandomInt(0, num - 1);
            var ranAttr = allAttrs.get(ranInt);
            ranAttr.click();
            done();
        });
    });

    //var randomEditFilterName = '';
    it('should check one edit filter randomly', function (done) {
        var allFilters = chaisePage.editFilter.editFilterAttrsDisplayed;
        allFilters.count().then(function (num) {
            var ranInt = chaisePage.tools.getRandomInt(0, num - 1);
            var ranAttr = allFilters.get(ranInt);
            var randAttrLabel = ranAttr.$('label');
            randAttrLabel.click();
            done();
            //ranAttr.getText().then(function (attrName) {
            //    randomEditFilterName = attrName;
            //    console.log("this is edit attr " + attrName);
            //    done();
            //});
        });
    });

    it('should show >0 results', function (done) {
        var allResults = chaisePage.resultContent.resultAllRows;
        expect(allResults.count()).toBeGreaterThan(0);
        done();
    });


    describe('one randomly chosen record in the results,', function () {
        var randResult;

        it('should be chosen randomly', function (done) {
            var allResults = chaisePage.resultContent.resultAllRows;
            allResults.count().then(function (num) {
                var rand = chaisePage.tools.getRandomInt(0, num - 1);
                randResult = allResults.get(rand);
                expect(randResult.isDisplayed()).toBe(true);
                done();
                //randResult.getText().then(function (attrName) {
                //    expect(randResult.isDisplayed()).toBe(true);
                //    done();
                //});
            });
        });

        it('should have non-empty title', function (done) {
            var titleEle = chaisePage.resultContent.getResultTitleElement(randResult);
            expect(titleEle.getText()).not.toBe('');
            done();
        });

        it('should display the title', function (done) {
            var titleEle = chaisePage.resultContent.getResultTitleElement(randResult);
            expect(titleEle.isDisplayed()).toBe(true);
            done();
        });

        it('should display the image', function (done) {
            var imgEle = chaisePage.resultContent.getResultImgElement(randResult);
            expect(imgEle.isDisplayed()).toBe(true);
            done();
        });

        it('should display the \'summary\' title', function (done) {
            var summaryEle = chaisePage.resultContent.getResultSummaryElement(randResult);
            expect(summaryEle.getText()).toBe('Summary');
            expect(summaryEle.isDisplayed()).toBe(true);
            done();
        });

        it('should display the \'investigator\' title', function (done) {
            var investEle = chaisePage.resultContent.getResultInvestigatorElement(randResult);
            expect(investEle.getText()).toBe('Investigator');
            expect(investEle.isDisplayed()).toBe(true);
            done();
        });
    });
});
