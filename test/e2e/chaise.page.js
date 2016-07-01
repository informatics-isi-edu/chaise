/**
 *
 * Created by shuai on 1/14/16.
 *
 * To store reusable elements and functions.
 *
 */

var Q = require('q');

function tools() {
    this.getRandomInt = function (min, max) {
        //include min and max
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    this.getSiblingByCss = function (ele, cssStr) {
        return ele.element(by.xpath('following-sibling::' + cssStr));
    }
};

var toolkit = new tools();

/*
    Utility object for finding elements under '#sidebar' element.
 */
var sidebarId = '#sidebar';
function sidebar() {
    var that = this;
    this.htmlElement = $(sidebarId);
    this.searchInput = this.htmlElement.$('div.search-box > input');
    this.sidebarAttrsDisplayed = this.htmlElement.all(by.css('ul.sidebar-nav li.ng-scope:not(.ng-hide)'));
    this.getSidebarAttrsDisplayed = function() {
        return this.htmlElement.all(by.css('ul.sidebar-nav li.ng-scope:not(.ng-hide)'));
    };
    this.sidebarHeader = this.htmlElement.$('#navcontainer h4');
    this.viewMoreBtn = this.htmlElement.element(by.cssContainingText('li a', 'View all attributes'));
    this.findSidebarAttrVisibleByName = function(attrName) {
        return that.htmlElement.element(by.cssContainingText('ul li.ng-scope:not(.ng-hide) a', attrName));
    };
    this.findSidebarAttrByName = function (attrName) {
        return that.htmlElement.element(by.cssContainingText('ul li.ng-scope a', attrName));
    };
    this.isSidebarAttrDisplayed = function (attrName) {
        var defer = Q.defer(), resolved = false;
        that.htmlElement.all(by.cssContainingText('ul li.ng-scope:not(.ng-hide) a', attrName)).then(function(elements) {
            var resolvedCount = 0;
            elements.forEach(function(e) {
                e.getText().then(function(txt) {
                    if (!resolved) {
                        if (txt.trim() == attrName) {
                            resolved = true;
                        }
                    }

                    if (++resolvedCount == elements.length) {
                        defer.fulfill(resolved);
                    };
                });
            });
        }, function(err) {
            throw err;
        });

        return defer.promise;
    };
    this.clickSidebarAttr = function (attrName) {
        that.htmlElement.all(by.cssContainingText('ul li.ng-scope:not(.ng-hide) a', attrName)).then(function(elements) {
            var resolved = 0;
            elements.forEach(function(e) {
                e.getText().then(function(txt) {
                    if (!resolved) {
                        if (txt.trim() == attrName) {
                            resolved = true;
                            e.click();
                        }
                    }
                });
            });
        }, function(err) {
            throw err;
        });
    };
};

/*
 Utility object for finding elements under '#morefilters' element.
 */
var moreFilterId = '#morefilters';
function moreFilter() {
    var that = this;
    this.htmlElement = $(moreFilterId);
    this.sidebarHeader = this.htmlElement.$('div.sidebar-title h4');
    this.findFirstUncheckedAttrCheckBox = function () {
        return that.htmlElement.
        all(by.css('label[ng-class="sideBar.getMoreFieldValueClass(facet)"]:not(.toggler--is-active)')).first();
    };
    this.findFirstCheckedAttrCheckBox = function () {
        return this.findAllCheckedAttrCheckbox().first();
    };
    this.findAllCheckedAttrCheckbox = function() {
        return this.htmlElement.all(by.css('label[ng-class="sideBar.getMoreFieldValueClass(facet)"].toggler--is-active'));
    };
    this.findMorefilterAttrByName = function (attrName) {
        return this.htmlElement.element(by.cssContainingText('div.editvalue-container' +
            ' div[ng-repeat="facet in FacetsData.facets"] label', attrName));
    };
    this.clickMorefilterAttrByName = function(attrName) {
        var defer = protractor.promise.defer();

        return this.htmlElement.all(by.cssContainingText('div.editvalue-container' +
            ' div[ng-repeat="facet in FacetsData.facets"] label', attrName)).then(function(elements) {
                var resolved = false;
                elements.forEach(function(e) {
                    e.getText().then(function(txt) {
                        if (!resolved && txt.trim() == attrName) {
                            resolved = true;
                            e.click();
                            defer.fulfill();
                        }
                    });
                });
        });

        return defer.promise;
    };
    this.goBackToSidebar = function () {
        that.sidebarHeader.click();
    };
};

/*
 Utility object for finding elements under '#editfilter' element.
 */
var editFilterId = '#editfilter';
function editFilter() {
    var that = this;
    this.htmlElement = $(editFilterId);
    this.sidebarHeader = this.htmlElement.$('div.sidebar-title h4');
    this.editFilterAttrsDisplayed = this.htmlElement.all(by.css('ul.nav.filteritems li.ng-scope:not(.ng-hide)'));
    this.getEditFilterAttrsDisplayed = function() {
        return this.htmlElement.all(by.css('ul.nav.filteritems li.ng-scope:not(.ng-hide)'));
    }
    this.findEditfilterAttrByName = function (attrName) {
        return that.htmlElement.element(by.cssContainingText('ul.nav.filteritems li.ng-scope:not(.ng-hide) label', attrName));
    };
    this.clickEditFilter = function (attrName) {
        that.findEditfilterAttrByName(attrName).click();
    };
    this.getCheckedEditFilters = function() {
        return this.htmlElement.all(by.css('ul.nav.filteritems li.ng-scope:not(.ng-hide) label[ng-class="sideBar.getFieldValueClass(FacetsData.tag, value)"].toggler--is-active'));
    };
    this.goBackToSidebar = function () {
        that.sidebarHeader.click();
    };
    this.findEditFilterLiByName = function (attrName) {
        return that.htmlElement.element(by.cssContainingText('ul.nav.filteritems li.ng-scope:not(.ng-hide)', attrName));
    };
    this.findCheckStatusDivByName = function (attr) {
        return that.findEditFilterLiByName(attr).$('div[ng-click="sideBar.checkUncheck($event,value)"]');
    }
};

function contentFilter() {
    var that = this;
    var filterEle = '#filter';
    this.htmlElement = $(filterEle);
    this.clearAllBtn = this.htmlElement.element(by.cssContainingText('div.filter-item.ng-scope > a', 'Clear All Filters'));
    this.displayedFilters = this.htmlElement.all(by.css('div.filter-item.ng-scope:not(.ng-hide)'));
    this.clickClearAllBtn = function () {
        that.clearAllBtn.click();
    };
    this.findFilterWrapperByName = function (attrName) {
        return that.htmlElement.element(by.cssContainingText('div.filter-item.ng-scope:not(.ng-hide)', attrName))
    };
    this.findFilterWrapperTitleByWrapperName = function (wrapperAttrName) {
        var titleSpan = that.findFilterWrapperByName(wrapperAttrName)
            .$('span[ng-attr-title="{{facetResults.displayTitle(facet)}}"]');
        return titleSpan.getAttribute('title');
    };
    this.clickFilterWrapperCancelByName = function (attrName) {
        that.findFilterWrapperByName(attrName).$('a.filter-link-cancel').click();
    };
    this.findCheckedSubfiltersByName = function (attrName) {
        return that.findFilterWrapperByName(attrName).all(by.css('span.filter-item-value.ng-scope > span'));
    };
};

function resultContent() {
    var that = this;
    this.resultAllRows = element.all(by.repeater('row in FacetsData.ermrestData'));
    this.resultTally = element.all(by.css('#results_tally')).get(1);
    this.numOfRecords = this.resultTally.all(by.css('strong')).last();
    this.currentRecordCount = this.resultTally.all(by.css('strong')).first();
    this.getResultRowsByViewType = function(viewType) {
        return element.all(by.css('[ng-show="FacetsData.view==\'list\'"]'));
    };
    this.permalink = element(by.css('#permalink'));
    this.filter = new contentFilter();
    this.getAllResultRows = function() {
        return element.all(by.repeater('row in FacetsData.ermrestData'));
    };
    this.getResultTally = function() {
        return element.all(by.css('#results_tally')).get(1);
    };
    this.getNumOfRecords = function() {
        return this.resultTally.all(by.css('strong')).last();
    };
    //ele is element found using resultAllRows.get(idx);
    this.getResultTitleElement = function (ele) {
        return ele.$('span.panel-title.ng-binding');
    };
    this.getResultTitleAnchorUrl = function (ele) {
        return ele.$('div.panel-heading a').getAttribute('href');
    }
    this.getResultImgElement = function (ele) {
        return ele.$('img');
    };
    this.getResultInvestigatorElement = function (ele) {
        return ele.element(by.cssContainingText('dt.ng-binding', 'Investigator'));
    };
    this.getResultInvestigatorContent = function (ele) {
        var investEle = that.getResultInvestigatorElement(ele);
        return toolkit.getSiblingByCss(investEle, 'dd');
    };
    this.getResultSummaryElement = function (ele) {
        return ele.element(by.cssContainingText('dt.ng-binding', 'Summary'));
    };
    this.getResultSummaryContent = function (ele) {
        var summaryEle = that.getResultSummaryElement(ele);
        return toolkit.getSiblingByCss(summaryEle, 'dd');
    }
};

function recordPage() {
    var that = this;
    this.entityTitle = $('#entity-title');
    this.getEntityTitle = function() {
        return $('#entity-title');
    };
    this.findEntityKeyByName = function (entityName) {
        //return element(by.css('.entity-key.ng-binding:contains("' + entityName + '")'));
        //return element(by.xpath('//span[.=\'' + entityName + '\']'));
        return element(by.cssContainingText('span.entity-key', entityName));
    };
    this.findEntityValueByName = function (entityName) {
        var entityKey = that.findEntityKeyByName(entityName);
        var parentEl = entityKey.element(by.xpath('..')); 
        return toolkit.getSiblingByCss(parentEl, 'td');
    };
    this.findAssociationKeyByName = function (associateName) {
        return element(by.xpath('//td[.=\'' + associateName + '\']'));
    };
    this.findAssociationValueByName = function (associateName) {
        var associationKeyElement = that.findAssociationKeyByName(associateName);
        return toolkit.getSiblingByCss(associationKeyElement, 'td');
    };
    this.findToggleWrapperByName = function (keyName) {
        return element(by.cssContainingText('.panel-group div.panel.panel-default', keyName))
    };
    this.clickToggleWrapperByName = function (keyName) {
        that.findToggleWrapperByName(keyName).click();
    };
};

function chaisePage() {
    this.sidebar = new sidebar();
    this.moreFilter = new moreFilter();
    this.editFilter = new editFilter();
    this.resultContent = new resultContent();
    this.recordPage = new recordPage();
    this.tools = new tools();
    this.tourButton = element(by.css('.tour-start-btn'));
    this.tourBox = element(by.css('.tour-DataBrowserTour'));
    
    this.customExpect = {
        elementContainClass: function (ele, className) {
            expect(ele.getAttribute('class')).toContain(className);
        }
    };
    this.setAuthCookie = function(url, authCookie) {
        if (url && authCookie) {
            // Visit the default page and set the authorization cookie if required
            browser.get(url);
            browser.sleep(3000);
            browser.driver.executeScript('document.cookie="' + authCookie + 'path=/;secure;"');
        }
    };
    this.getConfig = function(paths) {
        var suite = browser.params.configuration.tests;
        for (var i = 0; i < paths.length; i++) {
            if (!suite) break;
            suite = suite[paths[i]];
        }

        if (!suite || suite == 'ignore') {
            expect(true).toBe(true);
            return false;
        }
        return suite;
    };
    this.getCurrentContext = function() {

        var deferred = protractor.promise.defer();
        
        browser.executeScript('return window.location.hash;').then(function(hash) {
            var context = {};
            
            if (hash === undefined || hash == '' || hash.length == 1) {
                return deferred.fulfill(context);
            }

            var parts = hash.substring(1).split('/');
            context.catalogID = parts[0];
            if (parts[1]) {
                var params = parts[1].split(':');
                if (params.length > 1) {
                    context.schemaName = decodeURIComponent(params[0]);
                    context.tableName = decodeURIComponent(params[1]);
                } else {
                    context.tableName = decodeURIComponent(params[0]);
                }
            }

            // If there are filters appended to the URL, add them to context.js
            if (parts[2]) {
                context.filters = {};
                var filters = parts[2].split('&');
                for (var i = 0, len = filters.length; i < len; i++) {
                    var filter = filters[i].split('=');
                    if (filter[0] && filter[1]) {
                        context.filters[decodeURIComponent(filter[0])] = decodeURIComponent(filter[1]);
                    }
                }
            }

            deferred.fulfill(context);
        });

        return deferred.promise;
    };

    this.dataUtils = new (require('./utils/page.utils.js'))();
};

module.exports = new chaisePage();
