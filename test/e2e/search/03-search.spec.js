/**
 *
 * Created by shuai.
 *
 * Choose the first record, click it to see the record page.
 * Test the visibility of attributes of record.
 *
 * Warning: changed rootElement, using browser.rootEl = "#recordApp";
 *
 */

var chaisePage = require('../chaise.page.js');
var pageAction = require('../page.action.js');

xdescribe('In Chaise, search_03 record,', function () {
    var EC = protractor.ExpectedConditions;

    describe('on load,', function () {
        it('should load the page', function (done) {
            pageAction.loadChaise();
            done();
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
    describe('Result content area,', function () {
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

    describe('the record detail page,', function () {
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
            expect(dataTypeValueLabelEle.getText()).not.toBe('');
            done();
        });

        it('should show correct file when \'FILES\' is clicked', function (done) {
            var accessionEle = chaisePage.recordPage.findEntityKeyByName('accession');
            var accessionValueEle = accessionEle.element(by.xpath('following-sibling::td'));
            accessionValueEle.getText().then(function(expectedFileName) {
                var fileEle = chaisePage.recordPage.findToggleByName('Files');
                var fileCollapsedEle = fileEle.element(by.xpath('following-sibling::div'));
                expect(fileCollapsedEle.isDisplayed()).toBe(false);

                fileEle.click().then(function () {
                    expect(fileCollapsedEle.isDisplayed()).toBe(true);
                    var fileList = fileCollapsedEle.all(by.repeater('file in entity.files'));
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
