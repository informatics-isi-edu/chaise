var chaisePage = require('../chaise.page.js');

xdescribe('Search result columns,', function () {
    var EC = protractor.ExpectedConditions;

    beforeAll(function (done) {
        browser.get('');
        var sidebar = element(by.id('sidebar'));
        browser.ignoreSynchronization = true;
        browser.wait(EC.visibilityOf(sidebar), 10000).then(function () {
            done();
        });
    });

    it('should click one sidebar attribute randomly', function () {
        var allAttrs = chaisePage.sidebar.sidebarAttrsDisplayed;
        allAttrs.count().then(function (num) {
            var ranInt = chaisePage.tools.getRandomInt(0, num - 1);
            var ranAttr = allAttrs.get(ranInt);
            ranAttr.click();
        });
    });

    it('should check one edit filter randomly', function () {
        var allFilters = chaisePage.editFilter.editFilterAttrsDisplayed;
        allFilters.count().then(function (num) {
            var ranInt = chaisePage.tools.getRandomInt(0, num - 1);
            var ranAttr = allFilters.get(ranInt);
            var randAttrLabel = ranAttr.$('label');
            randAttrLabel.click();
        });
    });

    it('should show >0 results', function () {
        var allResults = chaisePage.resultContent.resultAllRows;
        expect(allResults.count()).toBeGreaterThan(0);
    });


    describe('one randomly chosen record in the results,', function () {
        var randResult;

        it('should be chosen randomly', function () {
            var allResults = chaisePage.resultContent.resultAllRows;
            allResults.count().then(function (num) {
                var rand = chaisePage.tools.getRandomInt(0, num - 1);
                randResult = allResults.get(rand);
                expect(randResult.isDisplayed()).toBe(true);
            });
        });

        it('should have non-empty title', function () {
            var titleEle = chaisePage.resultContent.getResultTitleElement(randResult);
            expect(titleEle.getText()).not.toBe('');
        });

        it('should display the title', function () {
            var titleEle = chaisePage.resultContent.getResultTitleElement(randResult);
            expect(titleEle.isDisplayed()).toBe(true);
        });

        it('should display the image', function () {
            var imgEle = chaisePage.resultContent.getResultImgElement(randResult);
            expect(imgEle.isDisplayed()).toBe(true);
        });

        it('should display the \'summary\' title', function () {
            var summaryEle = chaisePage.resultContent.getResultSummaryElement(randResult);
            expect(summaryEle.getText()).toBe('Summary');
            expect(summaryEle.isDisplayed()).toBe(true);
        });

        it('should display the \'investigator\' title', function () {
            var investEle = chaisePage.resultContent.getResultInvestigatorElement(randResult);
            expect(investEle.getText()).toBe('Investigator');
            expect(investEle.isDisplayed()).toBe(true);
        });
    });
});
