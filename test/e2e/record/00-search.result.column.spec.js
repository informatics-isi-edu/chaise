var chaisePage = require('../chaise.page.js');

describe('Search result columns,', function () {

    var EC = protractor.ExpectedConditions;
    var timeout  = 10000;
    beforeAll(function (done) {
        browser.get('');
        var sidebar = element(by.id('sidebar'));
        browser.ignoreSynchronization = true;
        browser.wait(EC.visibilityOf(sidebar), 10000).then(function () {
            done();
        });
    });

    it('should click one sidebar attribute randomly', function () {
        var allAttrs = chaisePage.sidebar.getSidebarAttrsDisplayed();
        allAttrs.count().then(function (num) {
            var ranInt = chaisePage.tools.getRandomInt(0, num - 1);
            var ranAttr = allAttrs.get(ranInt);
            browser.wait(EC.elementToBeClickable(ranAttr), timeout).then(function() {
                ranAttr.click();
            }, function() {
                console.log('Waiting for element to click sidebar' + '\' timed out');
            });
        });
    });

    it('should check one edit filter randomly', function () {
        var allFilters = chaisePage.editFilter.getEditFilterAttrsDisplayed();
        allFilters.count().then(function (num) {
            var ranInt = chaisePage.tools.getRandomInt(0, num - 1);
            var ranAttr = allFilters.get(ranInt);
            var randAttrLabel = ranAttr.$('label');
            browser.wait(EC.elementToBeClickable(randAttrLabel), timeout).then(function() {
                randAttrLabel.click();
            }, function() {
                console.log('Waiting for element to check one filter in sidebar' + '\' timed out');
            });
        });
    });

    it('should show >0 results', function () {
        browser.sleep(3000);
        var allResults = chaisePage.resultContent.getAllResultRows();
        expect(allResults.count()).toBeGreaterThan(0);
    });


    describe('one randomly chosen record in the results,', function () {

        var randResult, rand, length;

        it('should be chosen randomly', function () {
            var allResults = chaisePage.resultContent.getAllResultRows();
            allResults.then(function (items) {

                length = items.length;
                rand = chaisePage.tools.getRandomInt(0, items.length - 1);
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
