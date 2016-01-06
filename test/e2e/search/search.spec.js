// Each suite should begin with a `describe`
describe('In the Chaise search app,', function () {
    var EC = protractor.ExpectedConditions;

    describe('on load,', function () {
        beforeAll(function () {
            browser.get('');
        });
        it('should show the spinner', function (done) {
            var spinner = element(by.id('spinner'));
            // Browser waits (up to 500ms) for spinner to become visible before continuing
            browser.wait(EC.visibilityOf(spinner), 500).then(function () {
                expect(spinner.isDisplayed()).toBe(true);
                done();
            });
        });

        it('should open the initial sidebar', function (done) {
            var spinner = element(by.id('spinner'));
            var sidebar = element(by.id('sidebar'));
            browser.wait(EC.visibilityOf(sidebar), 10000).then(function () {
                expect(sidebar.isDisplayed()).toBe(true);
                expect(spinner.isDisplayed()).toBe(false);
                done();
            });
        });

        it('should have > 1 visible facets to choose from', function (done) {
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
    });

    describe('the initial facet selection sidebar', function () {
        var expectedFacetsNum = 0;
        //choose the first element found, because it's the one we are looking for
        //use first() instead of [0], so the Promise can be resolved
        var searchBox = element.all(by.model('FacetsData.searchFilter')).first();
        it('should display 0 attributes when searching for something nonexistent', function (done) {
            browser.wait(EC.visibilityOf(searchBox), 500).then(function () {
                // Set values (usually inputs) via sendKeys();
                searchBox.sendKeys('hello');
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

        it('should find 8 attributes when searching for \'RNA\' in the search box', function (done) {
            var expectedAttrNum = 8;
            browser.wait(EC.visibilityOf(searchBox), 500).then(function () {
                // Set values (usually inputs) via sendKeys();
                searchBox.clear();
                searchBox.sendKeys('RNA');
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
                            expect(shownFacetsNum).toEqual(expectedAttrNum);
                            done();
                        });
                    });
                });
            });
        });

        it('should show 3 attributes after clicking \"Experiment Type\"', function (done) {
            var expectedAttrNum = 3;
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
                    expect(shownFacets).toBe(expectedAttrNum);
                    done();
                });
            });
        });

        it('should find \'RNA express (microarray)\', click it and wait for 5s', function (done) {
            var nameOfResultFilter = 'RNA expression (microarray)';
            //var microarrayFilterLabel = element(by.cssContainingText('label.ng-binding.toggler', nameOfResultFilter))
            var microarrayFilterLabelLi = element(by.cssContainingText('div.editvalue-container li', nameOfResultFilter));
            var microarrayFilterLabel = microarrayFilterLabelLi.element(by.css('input'));
            browser.wait(EC.visibilityOf(microarrayFilterLabel), 500).then(function () {
                microarrayFilterLabel.click();
                setTimeout(function() {
                    done();
                }, 10000);
            });
        });

        xit('should show 25 out of 42 results', function (done) {
            var expectedShownResultsNum = 25;
            var expectedTotalResultsNum = 42;
            var allResults = element.all(by.repeater('row in FacetsData.ermrestData'));
            //choose the second #results_tally
            var resultTally = element.all(by.css('#results_tally')).get(1);
            var totalResults = resultTally.element(by.binding("FacetsData.totalServerItems"));
            allResults.count().then(function (allResultsNum) {
                totalResults.getText().then(function (totalResultsText) {
                    //test = "42"
                    expect(totalResultsText).toBe(expectedTotalResultsNum + "");
                    expect(allResultsNum).toBe(expectedShownResultsNum);
                    done();
                });
            });
        });

        xit('should go to the right URL and show details when clicked', function (done) {
            var detailUrl = "https://dev.misd.isi.edu/chaise/record/#1/legacy:dataset/id=263";
            //var titleSpan = element(by.cssContainingText('span.panel-title', titleTxt));
            var titleSpan = element.all(by.css('span.panel-title.ng-binding')).first();
            titleSpan.click();
            setTimeout(function () {
                browser.rootEl = "#recordApp";
                expect(browser.getCurrentUrl()).toBe(detailUrl);
                done();
            }, 2000);
        });

    });
});
