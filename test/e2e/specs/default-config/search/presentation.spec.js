/**
 * Created by shuai on 2/2/16.
 */
var chaisePage = require('../../../utils/chaise.page.js');
var filterObj = chaisePage.resultContent.filter;
var filterCount = 0;
var testParams = {
    attributes: [{
        clearAllFilters: false,
        clearPreviousFilters: false,
        text: "Category",
        filters: [{
            content: ["Hotel"],
            entityCount: 3
        }, {
            content: ["Hotel", "Motel"],
            entityCount: 4
        },	{
            content: ["Motel", "Resort"],
            entityCount: 2
        },{
            content: ["Hotel", "Motel", "Resort"],
            entityCount: 5
        }],
        totalContentCount: 3,
        totalEntityCount: 5
    }, {
        clearAllFilters: false,
        clearPreviousFilters: false,
        text: "Luxurious",
        filters: [{
            content: ["true"],
            entityCount: 4
        }, {
            content: ["false"],
            entityCount: 1
        }, {
            content: ["false", "true"],
            entityCount: 5
        }],
        totalContentCount: 2,
        totalEntityCount: 5
    }, {
        clearAllFilters: false,
        clearPreviousFilters: [0],
        text: "Name of Accommodation",
        filters: [{
            content: ["NH Munich Resort"],
            entityCount: 1
        }, {
            content: ["Sherathon Hotel", "Super 8 North Hollywood Motel"],
            entityCount: 2
        },	{
            content: ["Sherathon Hotel"],
            entityCount: 1
        }, {
            content: ["Radisson Hotel", "Super 8 North Hollywood Motel", "NH Munich Resort"],
            entityCount: 3
        }],
        totalContentCount: 5,
        totalEntityCount: 3
    }]
};


var testAttributes = function(attr, attrCount) {
    describe("for attribute " + attr.text, function() {
        var clearAttributes = [];
        if (!attr.clearAllFilters && attr.clearPreviousFilters) {
            if (attr.clearPreviousFilters.length > 0) {
                clearAttributes = attr.clearPreviousFilters;
            } else {
                startInd = attrCount - 1;
                clearAttributes.push(startInd);
            }
        }

        var endIndex = attrCount;
        var contentCount = 0;
        filterCount = filterCount - clearAttributes.length;
        filterCount++;

        beforeAll(function() {
            clearAttributes.forEach(function(ca) {
                 filterObj.clickFilterWrapperCancelByName(testParams.attributes[ca].text);
            });
        });

        attr.filters.forEach(function(filter) {
            testFilters(attr, filter, attrCount, filterCount, contentCount);
            contentCount++;
        });

        it('should show ' + attr.totalContentCount + ' edit filters in \'' + attr.text + '\' wrapper', function(){
            if (attr.totalContentCount != undefined) {
                expect(chaisePage.editFilter.getEditFilterAttrsDisplayed().count()).toBe(attr.totalContentCount);
            }
        });


        it('should show ' + attr.totalEntityCount + ' results in all for attribute ' + attr.text, function () {
            if (attr.totalEntityCount != undefined) {

                browser.wait(function() {
                    return chaisePage.resultContent.getAllResultRows().count().then(function(count) {
                      return count == attr.totalEntityCount;
                    });
                }, browser.params.defaultTimeout).finally(function() {
                    expect(chaisePage.resultContent.getAllResultRows().count()).toBe(attr.totalEntityCount);
                });

            }
        });

        it('should go back to initial sidebar', function () {
            chaisePage.editFilter.goBackToSidebar();
            expect(chaisePage.sidebar.sidebarHeader.isDisplayed()).toBe(true);
            expect(chaisePage.editFilter.sidebarHeader.getText()).toBe('');
        });
    });
};

var testFilters = function(attr, filter, attrCount, filterLen, contentCount) {
    describe('after checking ' + filter.content.length + ' edit filter(s) (\'' + filter.content.join(', ') + '\') in \'' + attr.text + '\',', function () {

        if (contentCount > 0) {
            it("should uncheck edit filters when cancel is clicked", function() {
                filterObj.clickFilterWrapperCancelByName(attr.text);
                var filters = chaisePage.editFilter.getCheckedEditFilters();
                expect(filters.count()).toBe(0);
            });
        } else {
            it('should click the attr ' + attr.text + ' in sidebar', function() {
                chaisePage.sidebar.clickSidebarAttr(attr.text);
            });
        }

        it('should check ' + filter.content.join(', ') + ' filters for an attribute ' + attr.text, function() {
            filter.content.forEach(function(c) {
                chaisePage.editFilter.clickEditFilter(c);
            });
        });

        it('should show the \'Clear All Filters\' button', function () {
            var clearAllBtn = filterObj.clearAllBtn;

            chaisePage.waitForElementCondition(filterObj.clearAllBtn.isDisplayed()).finally(function() {
                expect(clearAllBtn.isDisplayed()).toBe(true);
            });

        });

        it('should show \'' + attr.text + '\' wrapper', function () {
            var attrTextWrapper = filterObj.findFilterWrapperByName(attr.text);
            expect(attrTextWrapper.isDisplayed()).toBe(true);
        });

        it('should show ' + filter.content.length + ' edit filter in \'' + attr.text + '\' wrapper', function () {
            expect(chaisePage.resultContent.filter.findCheckedSubfiltersByName(attr.text).count()).toBe(filter.content.length);
        });


        if (filter.entityCount != undefined) {

            it('should show ' + filter.entityCount + ' results for filters ' + filter.content.join(','), function () {
                if (filter.entityCount != undefined) {
                    browser.wait(function() {
                        return chaisePage.resultContent.getAllResultRows().count().then(function(count) {
                          return count == filter.entityCount;
                        });
                    }, browser.params.defaultTimeout).finally(function() {
                        expect(chaisePage.resultContent.getAllResultRows().count()).toBe(filter.entityCount);
                    });
                }
            });


            it('should display records according to the selected view option. Default is the table view. ', function() {
                browser.executeScript('return window.CHAISE_DATA.view;').then(function(viewType) {
                    var el = chaisePage.resultContent.currentRecordCount;
                    el.getText().then(function(txt) {
                        var recordCount = txt.split('-')[1];
                        expect(chaisePage.resultContent.getResultRowsByViewType(viewType).count()).toBe(parseInt(recordCount));
                    });
                });
            });

            it('should have the number of items shown to be consistent with the numbers of rows shown.', function() {
                var allResults = chaisePage.resultContent.getAllResultRows();
                allResults.count().then(function(count) {
                    var el = chaisePage.resultContent.currentRecordCount;
                    el.getText().then(function(txt) {
                        var recordCount = txt.split('-')[1];
                        expect(parseInt(recordCount)).toBe(count);
                    });
                });
            });

            it('should have the number of results shown to be consistent with the total numbers of rows satisying the search criteria.', function() {
                var el = chaisePage.resultContent.numOfRecords
                el.getText().then(function(txt) {
                    expect(parseInt(txt)).toBe(filter.entityCount);
                });
            });

        }

        it('should show \'' + filter.content.join(', ') + '\' in \'' + attr.text + '\' wrapper', function () {
            filterObj.findFilterWrapperTitleByWrapperName(attr.text).then(function(title) {
                filter.content.forEach(function(content) {
                    expect(title).toContain(content);
                });
            });
        });

        // As filterCount starts from 0, we need to add a 1
        it('should show ' + filterLen + ' filter wrappers after \'' + filter.content.join(', ') + '\' in \'' + attr.text + '\' is checked', function () {
            // Displayed filters also contains the clear all filters so we need to add 1 more filter to take that in consideration
            expect(filterObj.displayedFilters.count()).toBe(filterLen + 1);
        });



        /*xit('the permalink should be same as the window url', function() {
            browser.executeScript('return window.location.href;').then(function(currentUrl) {
                chaisePage.resultContent.permalink.getAttribute('href').then(function(href) {
                    console.log(href);
                    expect(href).toBe(currentUrl);
                });

            });
        }); */

        it('the column names and values should be escaped properly', function() {
            browser.executeScript('return window.location.hash;').then(function(hash) {
                var facets = hash.substring(hash.indexOf('facets=(') + 8, hash.indexOf(')'));
                expect(/[!'()*]/.test(facets)).toBe(false);
            });
        });

    });
};

var testResultContent = function() {
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

    });
};

var afterAttributeTestCompletion = function() {

    describe('after \'Clear All Filters\' is clicked', function () {
        it('should show 0 filter wrappers and go back to initial sidebar', function () {
            filterObj.clickClearAllBtn();
            expect(filterObj.displayedFilters.count()).toBe(0);
        });

        it('should show correct initial sidebar header', function () {
            expect(chaisePage.sidebar.sidebarHeader.getText()).toBe('CHOOSE ATTRIBUTES');
        });

        testParams.attributes.forEach(function(attr) {
            determineFiltersUnchecked(attr);
        });

    });
};

var determineFiltersUnchecked = function(attr) {
    var filter = attr.filters[attr.filters.length - 1];

    it('should have unchecked \'' + filter.content.length + '\' edit filter in \'' + attr.text + '\'', function () {
        var EC = protractor.ExpectedConditions,
            sidebar = element(by.id("sidebar"));

        browser.wait(EC.visibilityOf(sidebar), browser.params.defaultTimeout);

        chaisePage.sidebar.clickSidebarAttr(attr.text);
        filter.content.forEach(function(c) {
            var el = chaisePage.editFilter.findCheckStatusDivByName(c);
            chaisePage.customExpect.elementContainClass(el, 'disabled');
        });
        chaisePage.editFilter.goBackToSidebar();
    });
};

describe('Filters on top of the records,', function () {
    var EC = protractor.ExpectedConditions;

    beforeAll(function () {
        browser.ignoreSynchronization=true;
        browser.get(browser.params.url + "/search/#" + browser.params.catalogId + "/product-search");
        var sidebar = element(by.id('sidebar'));
        browser.wait(EC.visibilityOf(sidebar), browser.params.defaultTimeout);
    });

    var attrCount = 0;
    testParams.attributes.forEach(function(attr) {
        testAttributes(attr, attrCount);
        attrCount++;
    });

    testResultContent();
    afterAttributeTestCompletion();

    describe("tour execution, ", function() {
        var tourButton = chaisePage.tourButton;

        it('should show the tour button', function() {
            expect(tourButton.isDisplayed()).toBe(true);
        });

        it('should click on tour button to start the tour', function() {
            tourButton.click().then(function() {
                chaisePage.waitForElement(chaisePage.tourBox).finally(function() {
                    expect(chaisePage.tourBox.isDisplayed()).toBe(true);
                });
            });
        });
    });
});

describe('Sidebar top search input,', function () {
    var EC = protractor.ExpectedConditions;

    beforeAll(function () {
        browser.ignoreSynchronization=true;
        browser.get(browser.params.url + "/search/#" + browser.params.catalogId + "/product-search");
        var sidebar = element(by.id('sidebar'));
        browser.wait(EC.visibilityOf(sidebar), browser.params.defaultTimeout);
    });

    var searchBox = chaisePage.sidebar.searchInput;
    var displayedAttrs = chaisePage.sidebar.sidebarAttrsDisplayed;

    var initAttrNum;
    it('should show >0 attributes when in initial state', function (done) {
        displayedAttrs.count().then(function (num) {
            initAttrNum = num;
            expect(num).toBeGreaterThan(0);
            done();
        });
    });

    var meaninglessTxt = 'hellogoodbye';
    it('should input meaningless text and wait for seconds', function () {
        searchBox.sendKeys(meaninglessTxt);
        searchBox.sendKeys(protractor.Key.BACK_SPACE);

        browser.wait(function() {
            return displayedAttrs.count().then(function(ct) {
                return ct == 0;
            });
        }, browser.params.defaultTimeout);

        expect(displayedAttrs.count()).toBe(0);
    });

    it('should show attributes of initial size', function () {
        for (var i = 0; i < meaninglessTxt.length; i++) {
            //hit back space several times to clear input and wait for AJAX
            searchBox.sendKeys(protractor.Key.BACK_SPACE);
        };

        browser.wait(function() {
            return displayedAttrs.count().then(function(ct) {
                return ct == initAttrNum;
            });
        }, browser.params.defaultTimeout);

        expect(displayedAttrs.count()).toBe(initAttrNum);
    });

});

describe('The initial sidebar,', function () {

    var EC = protractor.ExpectedConditions, spinner = element(by.id('spinner'));
    describe('when initializing,', function () {

        beforeAll(function() {
            browser.ignoreSynchronization=true;
            browser.get(browser.params.url + "/search/#" + browser.params.catalogId + "/product-search");
        });

        it('should show the spinner', function() {
            //so icon can be tested before everything settles down(settling down means img is no longer there)
            expect(spinner.isDisplayed()).toBe(true);
        });
    });

    describe('after initialization,', function () {

        var numOfAttrs, ranInt;
        it('should show the initial sidebar', function () {
            var sidebar = element(by.id('sidebar'));
            browser.wait(EC.visibilityOf(sidebar), browser.params.defaultTimeout).then(function () {
                expect(sidebar.isDisplayed()).toBe(true);
            });
        });

        it('should have > 1 visible attributes to choose from', function () {
            chaisePage.sidebar.sidebarAttrsDisplayed.count().then(function (num) {
                numOfAttrs = num;
                ranInt = chaisePage.tools.getRandomInt(0, numOfAttrs - 1);
                expect(num).toBeGreaterThan(0);
            });
        });

        describe('sidebar header title,', function () {
            var initSidebarHeaderText = 'CHOOSE ATTRIBUTES';
            var sidebarHeader = chaisePage.sidebar.sidebarHeader;
            it('should show correctly when initialized', function () {
                expect(sidebarHeader.getText()).toBe(initSidebarHeaderText);
            });

            var expectedAttr;

            var sidebarAttrTitle = chaisePage.editFilter.sidebarHeader;

            it('should change correctly when one attribute is chosen', function () {
                expectedAttr = chaisePage.sidebar.sidebarAttrsDisplayed.get(ranInt);
                expectedAttr.click();
                expectedAttr.getText().then(function (txt) {
                    expect(sidebarAttrTitle.getText()).toBe(txt.toUpperCase());
                });
            });

            it('should change back to \'CHOOSE ATTRIBUTES\' when clicking GoBack icon', function () {
                var sidebarBack = chaisePage.editFilter.sidebarHeader;
                sidebarBack.click();
                expect(sidebarHeader.getText()).toBe(initSidebarHeaderText);
            });
        });


        it('should show attributes with top or facetOrder annotation initially', function () {
            var columns = chaisePage.dataUtils.sidebar.getAllVisibleSidebarColumns(browser.params.defaultSchema, browser.params.defaultTable);
            chaisePage.sidebar.getSidebarAttrsDisplayed().then(function(sidebarAttributes) {
                expect(sidebarAttributes.length).toBe(columns.length);
                if (columns.length > 0) {
                    columns.forEach(function(c) {
                        var displayedAttr = chaisePage.sidebar.findSidebarAttrVisibleByName(chaisePage.dataUtils.sidebar.getColumnDisplayName(c));
                        displayedAttr.isDisplayed().then(function(displayed) {
                            if (!displayed) console.log(chaisePage.dataUtils.sidebar.getColumnDisplayName(c) + " not displayed");
                            expect(displayed).toBe(true);
                        });
                    });
                }
            });
        });

        it('should not show attributes with bottom', function () {
            var columns = chaisePage.dataUtils.sidebar.getInvisibleSidebarColumns(browser.params.defaultSchema, browser.params.defaultTable);
            columns.forEach(function(column) {
                chaisePage.sidebar.isSidebarAttrDisplayed(chaisePage.dataUtils.sidebar.getColumnDisplayName(column)).then(function(displayed) {
                    if (displayed) console.log(chaisePage.dataUtils.sidebar.getColumnDisplayName(column) + " is displayed");
                    expect(displayed).toBe(false);
                });
            });
        });

        var viewAll = chaisePage.sidebar.viewMoreBtn;

        it('the number in the () should be consistent with the number of items displayed in the list under "View all attributes"', function () {
            var columns = chaisePage.dataUtils.sidebar.getAllSidebarColumns(browser.params.defaultSchema, browser.params.defaultTable);
            expect(viewAll.getText()).toBe("View all attributes (" + columns.length + ")");
        });

        var sidebarHeader = chaisePage.sidebar.sidebarHeader;
        var previousChecked, previousCheckedText, previousUnchecked, previousUncheckedText;

        describe('when entering \'View All Attributes\'', function () {
            it('sidebar header should change to \'view all attributes\'', function () {
                viewAll.click();
                expect(chaisePage.moreFilter.sidebarHeader.getText()).toContain('ALL ATTRIBUTES');
            });

            it('attributes with "top" and "facetOrder" annotations should only be checked', function() {
                var columns = chaisePage.dataUtils.sidebar.getAllVisibleSidebarColumns(browser.params.defaultSchema, browser.params.defaultTable);
                chaisePage.moreFilter.findAllCheckedAttrCheckbox().then(function(checkedAttrs) {
                    expect(checkedAttrs.length).toBe(columns.length);
                    for (var i=0; i < checkedAttrs.length; i++) {
                        browser.executeScript('return arguments[0].innerHTML;', checkedAttrs[i].getWebElement()).then(function(txt) {
                            txt = txt.trim();
                            var found = columns.find(function(c) {
                                return chaisePage.dataUtils.sidebar.getColumnDisplayName(c) == txt;
                            }) ? true : false;
                            expect(found).toBe(true);
                        });
                    }
                });
            });

            it('first checked attribute name should be defined', function () {
                previousChecked = chaisePage.moreFilter.findFirstCheckedAttrCheckBox();
                previousChecked.getText().then(function (txt) {
                    expect(txt).toBeDefined();
                    previousCheckedText = txt;
                });
            });

            it('first unchecked attribute name should be defined', function () {
                previousUnchecked = chaisePage.moreFilter.findFirstUncheckedAttrCheckBox();
                previousUnchecked.getText().then(function (txt) {
                    expect(txt).toBeDefined();
                    previousUncheckedText = txt;
                });
            });

        });

        var previousCheckedAttr, previousUncheckedAttr;
        describe('when back to initial sidebar', function () {
            it('sidebar header should show \'CHOOSE ATTRIBUTES\'', function () {
                chaisePage.moreFilter.goBackToSidebar();
                expect(sidebarHeader.getText()).toBe('CHOOSE ATTRIBUTES');
            });

            it('should show previously checked attribute', function () {
                chaisePage.sidebar.isSidebarAttrDisplayed(previousCheckedText).then(function(displayed) {
                    if (!displayed) console.log(previousCheckedText + " is not displayed");
                    expect(displayed).toBe(true);
                });
            });

            it('should not show previously unchecked attribute', function () {
                chaisePage.sidebar.isSidebarAttrDisplayed(previousUncheckedText).then(function(displayed) {
                    if (displayed) console.log(previousUncheckedText + " is displayed");
                    expect(displayed).toBe(false);
                });
            });

            it('should entering \'View All Attributes\', check previously unchecked and uncheck ' +
                'previously checked', function () {
                viewAll.click();
                chaisePage.moreFilter.clickMorefilterAttrByName(previousCheckedText);
                chaisePage.moreFilter.clickMorefilterAttrByName(previousUncheckedText);
                chaisePage.moreFilter.goBackToSidebar();
            });
            it('should show previously unchecked attribute', function () {
                chaisePage.sidebar.isSidebarAttrDisplayed(previousCheckedText).then(function(displayed) {
                    if (displayed) console.log(previousCheckedText + " is displayed");
                    expect(displayed).toBe(false);
                });
            });
            it('should not show previously checked attribute', function () {
                chaisePage.sidebar.isSidebarAttrDisplayed(previousUncheckedText).then(function(displayed) {
                    expect(displayed).toBe(true);
                });
            });

        });
    });

});
