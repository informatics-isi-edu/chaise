var chaisePage = require('../chaise.page.js');

// Each suite should begin with a `describe`
describe('In the Chaise search app,', function () {
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

    describe('the initial attributes selection sidebar,', function () {
        it('should have > 1 visible attributes to choose from', function (done) {
            expect(chaisePage.sidebar.sidebarAttrsDisplayed.count()).toBeGreaterThan(0);
            done();
        });

        describe('sidebar header title,', function () {
            var initSidebarHeaderText = 'CHOOSE ATTRIBUTES:';
            var sidebarHeader = chaisePage.sidebar.sidebarHeader;
            it('should show correctly when initialized', function (done) {
                expect(sidebarHeader.getText()).toBe(initSidebarHeaderText);
                done();
            });

            var expectedAttr = 'Data Type';
            var dataTypeAttr = chaisePage.sidebar.findSidebarAttrByName(expectedAttr);
            var sidebarAttrTitle = chaisePage.editFilter.sidebarHeader;

            it('should change correctly when one attribute is chosen', function (done) {
                dataTypeAttr.click().then(function () {
                    expect(sidebarAttrTitle.getText()).toBe(expectedAttr.toUpperCase());
                    done();
                });
            });

            it('should change back to \'CHOOSE ATTRIBUTES\' when clicking GoBack icon', function (done) {
                var sidebarBack = chaisePage.editFilter.sidebarHeader;
                sidebarBack.click().then(function () {
                    expect(sidebarHeader.getText()).toBe(initSidebarHeaderText);
                    done();
                });
            });
        });

        describe('sidebar attribute,', function () {
            var somiteCount = 'Somite Count';
            var investigator = 'Investigator';
            var somiteCountAttr = chaisePage.sidebar.findSidebarAttrByName(somiteCount);
            var investigatorAttr = chaisePage.sidebar.findSidebarAttrByName(investigator);

            it('Somite Count attribute should be displayed', function (done) {
                expect(somiteCountAttr.isDisplayed()).toBe(true);
                done();
            });

            it('Investigator attribute should not be displayed', function (done) {
                expect(investigatorAttr.isDisplayed()).toBe(false);
                done();
            });

            it('should show Investigator and hide Somite Count after checking and unchecking', function (done) {
                var viewAll = chaisePage.sidebar.viewMoreBtn;
                var investigatorCheckbox = chaisePage.moreFilter.findMorefilterAttrByName(investigator);
                var somiteCountCheckbox = chaisePage.moreFilter.findMorefilterAttrByName(somiteCount);

                var sidebarHeader = chaisePage.moreFilter.sidebarHeader;
                //click to show all attributes' checkboxs
                viewAll.click();
                investigatorCheckbox.click();
                somiteCountCheckbox.click();
                //click GoBack to see attribute list
                sidebarHeader.click();
                expect(somiteCountAttr.isDisplayed()).toBe(false);
                expect(investigatorAttr.isDisplayed()).toBe(true);
                done();
            });
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

        it('should show >= 0 attributes after clicking \"Experiment Type\"', function (done) {
            var searchBoxInput = searchBox.getAttribute('value');
            expect(searchBoxInput).toBe('RNA');

            var experimentType = 'Experiment Type';
            var experimentFacet = chaisePage.sidebar.findSidebarAttrByName(experimentType);
            browser.wait(EC.visibilityOf(experimentFacet), 500).then(function () {
                experimentFacet.click();
            });
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

    var expectedEntityTitle = '';
    var detailUrl = "https://dev.misd.isi.edu/chaise/record/#1/legacy:dataset/id=263";
    describe('Result content area ', function () {
        it('should show > 0 results', function (done) {
            var allResultRows = chaisePage.resultContent.resultAllRows;
            //choose the second #results_tally
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
                expect(txt.indexOf(miRNAText) !== -1).toBe(true);
                done();
            });
        });


        var titleSpan = chaisePage.resultContent.resultAllRows.first().$('span.panel-title');
        it('should get the entity title and it\'s not empty', function (done) {
            titleSpan.getText().then(function (text) {
                //get the entity title in results list
                expectedEntityTitle = text;
                expect(text).not.toBe('');
                done();
            });
        });

        detailUrl = "https://dev.misd.isi.edu/chaise/record/#1/legacy:dataset/id=263";
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
            var entityTitleEle = element(by.css('#entity-title'));
            entityTitleEle.getText().then(function (entityTitle) {
                expect(entityTitleEle.isDisplayed()).toBe(true);
                expect(entityTitle).toBe(expectedEntityTitle);
                done();
            });
        });

        it('should have non-empty Description', function (done) {
            var descriptionEle = element(by.cssContainingText('.entity-key.ng-binding', 'description'));
            descriptionEle.getText().then(function (text) {
                expect(descriptionEle.isDisplayed()).toBe(true);
                expect(text).not.toBe('');
                var descriptionValueEle = descriptionEle.element(by.xpath('following-sibling::td'));
                descriptionValueEle.getText().then(function (desText) {
                    expect(desText).not.toBe('');
                    done();
                });
            });
        });

        it('should have \'Data Type\' and its label is clickable', function (done) {
            var dataTypeEle = element(by.cssContainingText('.entity-key.ng-binding', 'data type'));
            dataTypeEle.getText().then(function (text) {
                expect(dataTypeEle.isDisplayed()).toBe(true);
                expect(text).not.toBe('');
                var dataTypeValueLabelEle = dataTypeEle.element(by.xpath('following-sibling::td')).element(by.css('a'));
                dataTypeValueLabelEle.getText().then(function (labelText) {
                    expect(labelText).not.toBe('');
                    done();
                })
            });
        });

        it('should open a table when \'DATA SOMITE COUNT\' is clicked', function (done) {
            var dataEle = element(by.cssContainingText('.panel-heading', 'dataset somite count'));
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
            var expectedFileName = 'FB00000008.zip';
            var fileEle = element(by.cssContainingText('.panel-heading', 'Files'));
            var fileCollapedEle = fileEle.element(by.xpath('following-sibling::div'));
            expect(fileCollapedEle.isDisplayed()).toBe(false);

            fileEle.click().then(function () {
                expect(fileCollapedEle.isDisplayed()).toBe(true);
                var fileList = fileCollapedEle.all(by.repeater('file in entity.files'));
                var imgEle = fileList.first().element(by.css('img'));
                var fileNameEle = imgEle.all(by.xpath('following-sibling::div')).first();
                expect(fileNameEle.getText()).toBe(expectedFileName);
                expect(fileList.count()).toBe(1);
                done();
            });
        });
    });


});
