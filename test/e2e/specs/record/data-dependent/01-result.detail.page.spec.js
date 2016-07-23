var chaisePage = require('../../../utils/chaise.page.js');

describe('Search result detail page,', function () {
    var waitTimeAfterClickingEditFilter = 10000;
    var EC = protractor.ExpectedConditions;
    beforeEach(function (done) {
        browser.get('');
        var sidebar = element(by.id('sidebar'));
        browser.wait(EC.visibilityOf(sidebar), 10000).then(function () {
            done();
        });
        browser.executeScript('document.cookie = "ermrest=C6KFIQn2JS37CGovofWnjKfu;path=/;secure;"');
    });

    afterEach(function () {
        browser.rootEl = "#main-content";
        browser.ignoreSynchronization = false;
    });

    describe('should click one random sidebar attribute', function () {
        var randomSidebarAttr = '';
        var randomEditAttr = '';
        var randomRecordTitle = '';
        beforeEach(function () {
            var allAttrs = chaisePage.sidebar.getSidebarAttrsDisplayed();
            allAttrs.count().then(function (num) {
                    var ranInt = chaisePage.tools.getRandomInt(0, num - 1);
                    var ranAttr = allAttrs.get(ranInt);
                    ranAttr.getText().then(function (txt) {
                        randomSidebarAttr = txt;
                        console.log('' + txt);
                        ranAttr.click();
                    });
            });
        });

        describe('should check one random edit filter,', function () {
            beforeEach(function (done) {
                var allFilters = chaisePage.editFilter.getEditFilterAttrsDisplayed();
                allFilters.count().then(function (num) {
                    var ranInt = chaisePage.tools.getRandomInt(0, num - 1);
                    var ranAttr = allFilters.get(ranInt);
                    var randAttrLabel = ranAttr.$('label');
                    ranAttr.getText().then(function (attrName) {
                        randomEditAttr = attrName;
                        console.log('->' + attrName)
                        randAttrLabel.click();
                        setTimeout(function () {
                            done();
                        }, waitTimeAfterClickingEditFilter);
                    });
                });
            });

            describe('should click one random record in results,', function () {
                beforeEach(function (done) {
                    var allResults = chaisePage.resultContent.getAllResultRows();
                    allResults.count().then(function (num) {
                        var rand = chaisePage.tools.getRandomInt(0, num - 1);
                        var randResult = allResults.get(rand);
                        var randResultTitle = chaisePage.resultContent.getResultTitleElement(randResult);
                        randResultTitle.getText().then(function (title) {
                            randomRecordTitle = title;
                            console.log('->' + title);
                            randResultTitle.click();
                            browser.rootEl = "#recordApp";
                            browser.ignoreSynchronization = true;
                            var newPageTitleEle = element(by.id('record-bookmark-container'));
                            browser.wait(EC.visibilityOf(newPageTitleEle), 5000).then(function () {
                                done();
                            });
                        });
                    });
                });

                describe('the record detail page,', function () {
                    beforeEach(function (done) {
                        done();
                    });

                    it('should have the same title as previous record column', function () {
                        var entityTitle = chaisePage.recordPage.getEntityTitle();
                        expect(entityTitle.getText()).toBe(randomRecordTitle);
                    });

                    it('should display the \'Accession\' key and non-empty content', function () {
                        var accessionText = 'accession';
                        var accKey = chaisePage.recordPage.findEntityKeyByName(accessionText);
                        var accValue = chaisePage.recordPage.findEntityValueByName(accessionText);
                        expect(accKey.isDisplayed()).toBe(true);
                        expect(accValue.isDisplayed()).toBe(true);
                        expect(accValue.getText()).not.toBe('');
                        expect(accKey.getText()).toBe('Accession');
                    });
                    it('should display the \'Description\' key and non-empty content', function () {
                        var desText = 'description';
                        var accKey = chaisePage.recordPage.findEntityKeyByName(desText);
                        var accValue = chaisePage.recordPage.findEntityValueByName(desText);
                        expect(accKey.isDisplayed()).toBe(true);
                        expect(accValue.isDisplayed()).toBe(true);
                        expect(accValue.getText()).not.toBe('');
                        expect(accKey.getText()).toBe('Description');
                    });
                    xit('should display the \'Funding\' key and non-empty content', function () {
                        var fundingText = 'funding';
                        var accKey = chaisePage.recordPage.findEntityKeyByName(fundingText);
                        var accValue = chaisePage.recordPage.findEntityValueByName(fundingText);
                        expect(accKey.isDisplayed()).toBe(true);
                        expect(accValue.isDisplayed()).toBe(true);
                        expect(accValue.getText()).not.toBe('');
                        expect(accKey.getText()).toBe('Funding');
                    }).pend('Some record page may not contain "Funding", ex. Data Type -> Morphometic analysis');
                    xit('should display the \'Pubmed Id\' key and display \'N/A\' or digits', function () {
                        var pubmedText = 'pubmed id';
                        var accKey = chaisePage.recordPage.findEntityKeyByName(pubmedText);
                        var accValue = chaisePage.recordPage.findEntityValueByName(pubmedText);
                        expect(accKey.isDisplayed()).toBe(true);
                        expect(accValue.isDisplayed()).toBe(true);
                        expect(accValue.getText()).toMatch('(^[0-9]*$|^N/A$)');
                        expect(accKey.getText()).toBe('Pubmed Id');
                    }).pend('Some record page may not contain "Pumbed Id", ex. Mouse Phenotype -> Normative');

                    xit('should contain the randomly chosen attribute field', function () {
                        var sidebarAttr = randomSidebarAttr.toLowerCase();
                        var sidebarAttrKey = chaisePage.recordPage.findAssociationKeyByName(sidebarAttr);
                        expect(sidebarAttrKey.isDisplayed()).toBe(true);
                    });

                    xit('should contain the randomly chosen edit filter in association key', function () {
                        var sidebarAttr = randomSidebarAttr.toLowerCase();
                        var sidebarAttrValue = chaisePage.recordPage.findAssociationValueByName(sidebarAttr);
                        expect(sidebarAttrValue.isDisplayed()).toBe(true);
                        sidebarAttrValue.getText().then(function (valueText) {
                            expect(valueText.toLowerCase()).toContain(randomEditAttr.toLowerCase());
                        });
                    });

                    xit('should display \'Files\', toggle it ' + 'to display file icon or \'No rows found\'', function () {
                        var fileWrapper = chaisePage.recordPage.findToggleWrapperByName('Files');
                        expect(fileWrapper.isDisplayed()).toBe(true);
                        expect(fileWrapper.getText()).toBe('FILES');
                        chaisePage.recordPage.clickToggleWrapperByName('Files');
                        //var activeEle = fileWrapper.$('div[ng-class="{\'active\': files.open }"]');
                        //chaisePage.customExpect.elementContainClass(activeEle, 'active');
                        var collapseArea = fileWrapper.$('div.panel-collapse');
                        expect(collapseArea.isDisplayed()).toBe(true);
                        collapseArea.getText().then(function (text) {
                            //after testing, test.toLowerCase() will be exactly 'no rows found'
                            if (text.toLowerCase() !== 'no rows found') {
                                var fileImg = collapseArea.$('img');
                                expect(fileImg.isDisplayed()).toBe(true);
                            }
                        });
                    }).pend('Some record page may not contain "Files", ex. Organism -> Human');

                    it('should display \'Dataset Geo\', toggle it to display something', function () {
                        var dataset = 'dataset geo';
                        var dataSetWrapper = chaisePage.recordPage.findToggleWrapperByName(dataset);
                        chaisePage.recordPage.clickToggleWrapperByName(dataset);
                        var collapseArea = dataSetWrapper.$('div.panel-collapse');
                        expect(collapseArea.isDisplayed()).toBe(true);
                    });

                });


            });

        });

    });


});
