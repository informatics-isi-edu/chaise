var chaisePage = require('../chaise.page.js');

describe('In the Chaise 02-search app,', function () {
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
            expect(spinner.isDisplayed()).toBe(true);
            done();
        });

        it('should open the initial sidebar', function (done) {
            browser.ignoreSynchronization = false;
            var spinner = element(by.id('spinner'));
            var sidebar = element(by.id('sidebar'));
            browser.wait(EC.visibilityOf(sidebar), 10000).then(function () {
                expect(sidebar.isDisplayed()).toBe(true);
                expect(spinner.isDisplayed()).toBe(false);
                done();
            });
        });

    });

    describe('The sidebar filter input', function () {
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

    });

    var expectedEntityTitle = '';
    var detailUrl = "https://dev.misd.isi.edu/chaise/record/#1/legacy:dataset/id=263";
    describe('Result content area ', function () {
        //input is now "RNA"
        var experimentType = 'Experiment Type';
        var microArrayText = 'RNA expression (microarray)';

        var titleSpan = chaisePage.resultContent.resultAllRows.first().$('span.panel-title');
        it('should get the entity title and it\'s not empty', function (done) {
            titleSpan.getText().then(function (text) {
                //get the entity title in results list
                expectedEntityTitle = text;
                expect(text).not.toBe('');
                done();
            });
        });

        it('should go to the correct URL when clicked', function (done) {
            titleSpan.click();
            browser.rootEl = "#recordApp";
            // 'browser.ignoreSynchronization = true' tells Protractor not to sync(wait for Angular's finishing async operations).
            //It is not supposed to be used here, but somehow using it resolves the 'Hashtag' problem.
            //Before, the problem was, Angualr(or Browser) adds automatically a slash after '#', making '/#1/' become '/#/1/'.
            browser.ignoreSynchronization = true;
            setTimeout(function () {
                expect(browser.getCurrentUrl()).toBe(detailUrl);
                done();
            }, 5000);
        });
    });

    describe('the record detail page', function () {
        //turn on sync again
        browser.ignoreSynchronization = false;
        it('should still have the correct URL when sync is turned on', function (done) {
            //make sure after turning on Sync, the URL is not changed.
            expect(browser.getCurrentUrl()).toBe(detailUrl);
            done();
        });

        it('should have the correct title', function (done) {
            var entityTitleEle = chaisePage.recordPage.entityTitle;
            expect(entityTitleEle.isDisplayed()).toBe(true);
            expect(entityTitleEle.getText()).toBe(expectedEntityTitle);
            done();
        });

        it('should have non-empty Description', function (done) {
            var descriptionEle = chaisePage.recordPage.findEntityKeyByName('description');
            expect(descriptionEle.isDisplayed()).toBe(true);
            expect(descriptionEle.getText()).not.toBe('');
            var descriptionValueEle = descriptionEle.element(by.xpath('following-sibling::td'));
            expect(descriptionValueEle.getText()).not.toBe('');
            done();
        });

        it('should have \'Data Type\' and its label is clickable', function (done) {
            var dataTypeEle = chaisePage.recordPage.findEntityKeyByName('data type');
            expect(dataTypeEle.isDisplayed()).toBe(true);
            expect(dataTypeEle.getText()).not.toBe('');
            var dataTypeValueLabelEle = dataTypeEle.element(by.xpath('following-sibling::td')).element(by.css('a'));
            expect(dataTypeValueLabelEle.isDisplayed()).toBe(true);
            expect(dataTypeValueLabelEle.c).toBe(true);
            expect(dataTypeValueLabelEle.getText()).not.toBe('');
            done();
        });

        it('should open a table when \'DATA SOMITE COUNT\' is clicked', function (done) {
            var dataEle = chaisePage.recordPage.findToggleByName('dataset somite count');
            //click on the DATA SOMITE COUNT
            dataEle.click().then(function () {
                var datasetSomiteTableEle = dataEle.element(by.xpath('following-sibling::div'));
                expect(datasetSomiteTableEle.isDisplayed()).toBe(true);

                var wrapperEle = datasetSomiteTableEle.element(by.css('.table-wrapper.wrapper'));
                var wrapperEleTbody = wrapperEle.element(by.css('tbody'));
                var ftListArray = wrapperEleTbody.all(by.repeater('reference in ft.list'));
                var firstRow = ftListArray.first();
                //var firstRowKeyArray = firstRow.all(by.repeater('key in ft.keys'));
                var firstRowKeyArray = firstRow.all(by.css('.entity-value.col-xs-10.ng-scope'));
                var UrlEle = firstRowKeyArray.last();
                UrlEle.element(by.css('a')).getAttribute('href').then(function (linkText) {
                    expect(firstRow.isDisplayed()).toBe(true);
                    expect(linkText).toContain('http');
                    done();
                });
            });
        });

        it('should show one file when \'FILES\' is clicked', function (done) {
            var accessionEle = chaisePage.recordPage.findEntityKeyByName('accession');
            var accessionValueEle = accessionEle.element(by.xpath('following-sibling::td'));
            accessionValueEle.getText().then(function(expectedFileName) {
                var fileEle = chaisePage.recordPage.findToggleByName('Files');
                var fileCollapedEle = fileEle.element(by.xpath('following-sibling::div'));
                expect(fileCollapedEle.isDisplayed()).toBe(false);

                fileEle.click().then(function () {
                    expect(fileCollapedEle.isDisplayed()).toBe(true);
                    var fileList = fileCollapedEle.all(by.repeater('file in entity.files'));
                    var imgEle = fileList.first().element(by.css('img'));
                    var fileNameEle = imgEle.all(by.xpath('following-sibling::div')).first();
                    fileNameEle.getText().then(function(fileName) {
                        expect(fileName).toContain(expectedFileName);
                        expect(fileList.count()).not.toBe(0);
                        done();
                    });
                });
            });
        });
    });


});
