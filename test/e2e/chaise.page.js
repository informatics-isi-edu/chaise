/**
 *
 * Created by shuai on 1/14/16.
 *
 * To store reusable elements and functions.
 *
 */

var sidebarId= '#sidebar';
var moreFilterId= '#morefilters';
var editFilterId= '#editfilter';

function sidebar() {
    this.htmlElement = $(sidebarId);
    this.searchInput = this.htmlElement.$('div.search-box > input');
    this.sidebarAttrsDisplayed = this.htmlElement.all(by.css('ul.sidebar-nav li.ng-scope:not(.ng-hide)'));
    this.sidebarHeader =  this.htmlElement.$('#navcontainer h4');
    this.viewMoreBtn = this.htmlElement.element(by.cssContainingText('li a', 'View all attributes'));
    this.findSidebarAttrsByName = function (attrName) {
        return this.htmlElement.all(by.cssContainingText('ul li a', attrName))
    };
    this.findSidebarAttrByName = function (attrName) {
        return this.htmlElement.element(by.cssContainingText('ul li a', attrName));
    };
};

function moreFilter() {
    this.htmlElement = $(moreFilterId);
    this.sidebarHeader = this.htmlElement.$('div.sidebar-title h4');
    this.findMorefilterAttrByName = function(attrName) {
        return this.htmlElement.element(by.cssContainingText('div.editvalue-container' +
            ' div[ng-repeat="facet in FacetsData.facets"] label', attrName));
    };
};

function editFilter() {
    this.htmlElement = $(editFilterId);
    this.sidebarHeader = this.htmlElement.$('div.sidebar-title h4');
    this.displayedEditAttrs = this.htmlElement.all(by.css('ul.nav.filteritems li.ng-scope:not(.ng-hide)'));
    this.findEditfilterAttrByName = function(attrName) {
        return this.htmlElement.element(by.cssContainingText('ul.nav.filteritems li.ng-scope:not(.ng-hide) label', attrName));
    };
    this.findEditfilterLiByName = function (attrName) {
        return element(by.cssContainingText(editFilterId + ' ul.nav.filteritems li.ng-scope:not(.ng-hide)', attrName));
        return this.htmlElement.element(by.cssContainingText('ul.nav.filteritems li.ng-scope:not(.ng-hide)', attrName));
    };
};

function chaisePage() {
    this.sidebar = new sidebar();
    this.moreFilter = new moreFilter();
    this.editFilter = new editFilter();
    this.resultContent = {
        resultAllRows: element.all(by.repeater('row in FacetsData.ermrestData')),
        resultTallyRange: element.all(by.css('#results_tally')).get(1).element(by.binding("facetResults.displayRange()")),
        resultTallySum: element.all(by.css('#results_tally')).get(1).element(by.binding("FacetsData.totalServerItems")),
        filter: {
            clearAllBtn: element(by.cssContainingText('#filter div.filter-item.ng-scope > a', 'Clear All Filters')),
            //including the clearAllFilterBtn
            displayedFilters: element.all(by.css('#filter div.filter-item.ng-scope:not(.ng-hide)')),
            findFilterWrapperByName: function(attrName) {
                return element(by.cssContainingText('#filter div.filter-item.ng-scope:not(.ng-hide)', attrName));
            },
        },
    };
    this.recordPage = {
        entityTitle: element(by.css('#entity-title')),
        findEntityKeyByName: function(entityName) {
            return element(by.cssContainingText('.entity-key.ng-binding', entityName));
        },
        findToggleByName: function(keyName) {
            return element(by.cssContainingText('.panel-heading', keyName))
        },
    };
    this.tools = {
        getDisplayedRecordNum: function(str) {
            return str.split('-')[1];
        },
        getRandomInt: function(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },
        getAnyPartOfStr: function(str) {
            var len = str.length;
            //var idx = Math.floor(Math.random() * (len - 0 + 1) + 0);
            return str.substr(len / 2);
        },
    }
};

module.exports = new chaisePage();
