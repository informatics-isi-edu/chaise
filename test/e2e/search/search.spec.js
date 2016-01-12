

// Each suite should begin with a `describe`
describe('In the Chaise search app,', function () {
    var EC = protractor.ExpectedConditions;

    by.addLocator('findSidebarAttributes', function(attributeName, opt_parentElement) {
        var using = opt_parentElement || document;
        var navcontainer = using.querySelector('#navcontainer');
        var attributeAnchors = navcontainer.querySelectorAll('a');
        return attributeAnchors[0];
        //return Array.prototype.filter.call(attributeAnchors, function(ele) {
        //    return ele.textContent === attributeName;
        //});
    });

    by.addLocator('what', function(tag) {
        var using = document;
        var arr = using.querySelectorAll(tag);
        return arr;
    });

    it('should allow custom locator', function(done) {
        expect(by.findSidebarAttributes).toBeDefined();
        expect(by.what).toBeDefined();
        done();
    });

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
            // Browser waits (up to 500ms) for spinner to become visible before continuing
            //browser.wait(EC.visibilityOf(spinner), 10000).then(function () {
            //    expect(spinner.isDisplayed()).toBe(true);
            //    done();
            //});
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
            var facets = element.all(by.css('#sidebar ul.sidebar-nav li.ng-scope'));
            facets.then(function () {
                expect(facets.count()).toBeGreaterThan(0);
            });
            var hiddenFacets = element.all(by.css('#sidebar ul.sidebar-nav li.ng-scope.ng-hide'));
            hiddenFacets.then(function () {
                expect(hiddenFacets.count()).toBeLessThan(facets.count());
                done();
            });
        });

        describe('sidebar header title,', function () {
            var initSidebarHeaderText = 'CHOOSE ATTRIBUTES:';
            var navContainer = element(by.css('#navcontainer'));
            var sidebarHeader = navContainer.element(by.css('h4'));
            it('should show correctly when initialized', function (done) {
                expect(sidebarHeader.getText()).toBe(initSidebarHeaderText);
                done();
            });

            var expectedAttr = 'Data Type';
            var dataTypeAttr = navContainer.element(by.cssContainingText('.field-toggle.ng-binding', expectedAttr));
            var editFilter = element(by.css('#editfilter'));
            var sidebarAttrTitle = editFilter.element(by.css('.sidebar-title'));
            it('should change correctly when one attribute is chosen', function (done) {
                dataTypeAttr.click().then(function () {
                    expect(sidebarAttrTitle.getText()).toBe(expectedAttr.toUpperCase());
                    done();
                });
            });

            it('should change back to \'CHOOSE ATTRIBUTES\' when clicking GoBack icon', function (done) {
                var sidebarBack = editFilter.$('.sidebar-back');
                sidebarBack.click().then(function () {
                    expect(sidebarHeader.getText()).toBe(initSidebarHeaderText);
                    done();
                });
            });
        });

        describe('sidebar attribute,', function () {
            var somiteCount = 'Somite Count';
            var investigator = 'Investigator';
            var navContainer = element(by.css('#navcontainer'));
            //var somiteCountAttr = element(by.findSidebarAttributes(somiteCount));
            var somiteCountAttr = navContainer.element(by.cssContainingText('.field-toggle.ng-binding', somiteCount));
            var investigatorAttr = navContainer.element(by.cssContainingText('.field-toggle.ng-binding', investigator));

            it('Somite Count attribute should be displayed', function (done) {
                expect(somiteCountAttr.isDisplayed()).toBe(true);
                done();
            });

            it('Investigator attribute should not be displayed', function (done) {
                expect(investigatorAttr.isDisplayed()).toBe(false);
                done();
            });

            it('should show Investigator and hide Somite Count after checking and unchecking', function (done) {
                var viewAllAttributes = "View all attributes";
                var viewAll = navContainer.element(by.cssContainingText('.field-toggle.view-attr', viewAllAttributes));
                var moreFilters = element(by.css('#morefilters'));
                var investigatorCheckbox = moreFilters.element(by.cssContainingText('.field-enable.ng-scope', investigator)).$('input');
                var somiteCountCheckbox = moreFilters.element(by.cssContainingText('.field-enable.ng-scope', somiteCount)).$('input');

                var sidebarHeader = moreFilters.element(by.css('.sidebar-header'));

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
        var expectedFacetsNum = 0;
        //choose the first element found, because it's the one we are looking for
        //use first() instead of [0], so the Promise can be resolved
        var searchBox = element.all(by.model('FacetsData.searchFilter')).first();

        it('should display 0 attributes when searching for something nonexistent', function (done) {
            browser.wait(EC.visibilityOf(searchBox), 500).then(function () {
                // Set values (usually inputs) via sendKeys();
                searchBox.sendKeys('hellogoodbye');
            });

            var allFacets = element.all(by.css('#sidebar ul.sidebar-nav li.ng-scope'));
            var hiddenFacets = element.all(by.css('#sidebar ul.sidebar-nav li.ng-scope.ng-hide'));
            //use then to get the resolved result of Promise count()
            allFacets.count().then(function () {
                //use then to get the resolved result of Promise count()
                hiddenFacets.count().then(function () {
                    allFacets.count().then(function (allFacetsNum) {
                        hiddenFacets.count().then(function (hiddenFacetsNum) {
                            expect(allFacetsNum).toBeGreaterThan(0);
                            expect(hiddenFacetsNum).toBeGreaterThan(0);
                            var shownFacetsNum = allFacetsNum - hiddenFacetsNum;
                            expect(shownFacetsNum).toEqual(expectedFacetsNum);
                            done();
                        });
                    });
                });
            });
        });

        it('should find >= 0 attributes when searching for \'RNA\' in the search box', function (done) {
            var searchBox = element.all(by.model('FacetsData.searchFilter')).first();
            browser.wait(EC.visibilityOf(searchBox), 500).then(function () {
                // Set values (usually inputs) via sendKeys();
                searchBox.clear();
                searchBox.sendKeys('RNA');
            });
            var allFacets = element.all(by.css('#sidebar ul.sidebar-nav li.ng-scope'));
            var hiddenFacets = element.all(by.css('#sidebar ul.sidebar-nav li.ng-scope.ng-hide'));
            //use then to get the resolved result of Promise count()
            allFacets.count().then(function (allFacetsNum) {
                hiddenFacets.count().then(function (hiddenFacetsNum) {
                    expect(allFacetsNum).toBeGreaterThan(0);
                    expect(hiddenFacetsNum).toBeGreaterThan(0);
                    var shownFacetsNum = allFacetsNum - hiddenFacetsNum;
                    expect(shownFacetsNum).toBeGreaterThan(0);
                    done();
                });
            });
        });

        it('should show >= 0 attributes after clicking \"Experiment Type\"', function (done) {
            var searchBox = element.all(by.model('FacetsData.searchFilter')).first();
            var searchBoxInput = searchBox.getAttribute('value');
            expect(searchBoxInput).toBe('RNA');

            var experimentFacet = element(by.cssContainingText('.field-toggle.ng-binding', 'Experiment Type'));
            browser.wait(EC.visibilityOf(experimentFacet), 500).then(function () {
                experimentFacet.click();
            });
            var allFacets = element.all(by.css('#editfilter ul.nav.filteritems li.ng-scope'));
            var hiddenFacets = element.all(by.css('#editfilter ul.nav.filteritems li.ng-scope.ng-hide'));
            //use then to get the resolved result of Promise count()
            allFacets.count().then(function (allFacetsNum) {
                //use then to get the resolved result of Promise count()
                hiddenFacets.count().then(function (hiddenFacetsNum) {
                    expect(allFacetsNum).toBeGreaterThan(0);
                    expect(hiddenFacetsNum).toBeGreaterThan(0);
                    var shownFacets = allFacetsNum - hiddenFacetsNum;
                    expect(shownFacets).toBeGreaterThan(0);
                    done();
                });
            });
        });

        it('should find \'RNA express (microarray)\', click it and wait for 5s', function (done) {
            var nameOfResultFilter = 'RNA expression (microarray)';
            var microarrayFilterLabelLi = element(by.cssContainingText('div.editvalue-container li', nameOfResultFilter));
            var microarrayFilterLabel = microarrayFilterLabelLi.element(by.css('input'));
            browser.wait(EC.visibilityOf(microarrayFilterLabel), 500).then(function () {
                microarrayFilterLabel.click().then(function () {
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
            var allResults = element.all(by.repeater('row in FacetsData.ermrestData'));
            //choose the second #results_tally
            var resultTally = element.all(by.css('#results_tally')).get(1);
            var totalResults = resultTally.element(by.binding("FacetsData.totalServerItems"));
            allResults.count().then(function (allResultsNum) {
                totalResults.getText().then(function (totalResultsText) {
                    expect(totalResultsText).toBeGreaterThan(0);
                    expect(allResultsNum).toBeGreaterThan(0);
                    done();
                });
            });
        });

        it('should show \'Clear All Filters\' button and \'RNA expression\' filter', function(done) {
            var clearAllFilterText = 'Clear All Filters';
            var experimentType = 'Experiment Type';
            var microArrayText = 'RNA expression (microarray)';
            var filterDiv = element(by.css('#filter'));
            var clearAllFilterBtn = filterDiv.element(by.cssContainingText('a', clearAllFilterText));
            expect(clearAllFilterBtn.isDisplayed()).toBe(true);

            //how to select element excluding attributes
            var hasNoHide = filterDiv.all(by.css('.filter-item.ng-scope:not(.ng-hide)'));
            expect(hasNoHide.count()).toBe(2);
            var experimentTypeWrapper = filterDiv.element(by.cssContainingText('.filter-item.ng-scope', experimentType));
            var experimentTypeValueSpan = experimentTypeWrapper.element(by.css('span.filter-item-value.ng-scope'));
            var experimentTypeValues = experimentTypeValueSpan.all(by.css('span'));
            //since now only one 'RNA expression (microarray)' is selected
            expect(experimentTypeValues.count()).toBe(1);
            expect(experimentTypeValues.first().getText()).toBe(microArrayText);
            done();
        });

        it('should get the entity title and it\'s not empty', function (done) {
            var titleSpan = element.all(by.css('span.panel-title.ng-binding')).first();
            titleSpan.getText().then(function (text) {
                //get the entity title in results list
                expectedEntityTitle = text;
                expect(text).not.toBe('');
                done();
            });
        });

        detailUrl = "https://dev.misd.isi.edu/chaise/record/#1/legacy:dataset/id=263";
        it('should go to the correct URL when clicked', function (done) {
            //var titleSpan = element(by.cssContainingText('span.panel-title', titleTxt));
            var titleSpan = element.all(by.css('span.panel-title.ng-binding')).first();
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
