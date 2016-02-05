/**
 *
 * Created by shuai on 1/14/16.
 *
 * To store reusable elements and functions.
 *
 */

var sidebarId = '#sidebar';
var moreFilterId = '#morefilters';
var editFilterId = '#editfilter';

function tools() {
    this.getDisplayedRecordNum = function (str) {
        return str.split('-')[1];
    };
    this.getRandomInt = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min - 1;
    };
    this.getAnyPartOfStr = function (str) {
        var len = str.length;
        //var idx = Math.floor(Math.random() * (len - 0 + 1) + 0);
        return str.substr(len / 2);
    };
    this.getSiblingByCss = function (ele, cssStr) {
        return ele.element(by.xpath('following-sibling::' + cssStr));
    }
};

var toolkit = new tools();

function sidebar() {
    this.htmlElement = $(sidebarId);
    this.searchInput = this.htmlElement.$('div.search-box > input');
    this.sidebarAttrsDisplayed = this.htmlElement.all(by.css('ul.sidebar-nav li.ng-scope:not(.ng-hide)'));
    this.sidebarHeader = this.htmlElement.$('#navcontainer h4');
    this.viewMoreBtn = this.htmlElement.element(by.cssContainingText('li a', 'View all attributes'));
    this.findSidebarAttrsByName = function (attrName) {
        return this.htmlElement.all(by.cssContainingText('ul li a', attrName))
    };
    this.findSidebarAttrByName = function (attrName) {
        return this.htmlElement.element(by.cssContainingText('ul li a', attrName));
    };
    this.clickSidebarAttr = function (attrName) {
        this.findSidebarAttrByName(attrName).click();
    };
};

function moreFilter() {
    this.htmlElement = $(moreFilterId); this.sidebarHeader = this.htmlElement.$('div.sidebar-title h4');
    this.findMorefilterAttrByName = function (attrName) {
        return this.htmlElement.element(by.cssContainingText('div.editvalue-container' +
            ' div[ng-repeat="facet in FacetsData.facets"] label', attrName));
    };
    this.goBackToSidebar = function () {
        this.sidebarHeader.click();
    };
};

function editFilter() {
    this.htmlElement = $(editFilterId);
    this.sidebarHeader = this.htmlElement.$('div.sidebar-title h4');
    this.editFilterAttrsDisplayed = this.htmlElement.all(by.css('ul.nav.filteritems li.ng-scope:not(.ng-hide)'));
    this.findEditfilterAttrByName = function (attrName) {
        return this.htmlElement.element(by.cssContainingText('ul.nav.filteritems li.ng-scope:not(.ng-hide) label', attrName));
    };
    this.clickEditFilter = function (attrName) {
        this.findEditfilterAttrByName(attrName).click();
    };
    this.goBackToSidebar = function () {
        this.sidebarHeader.click();
    };
    this.findEditfilterLiByName = function (attrName) {
        return this.htmlElement.element(by.cssContainingText('ul.nav.filteritems li.ng-scope:not(.ng-hide)', attrName));
    };
    this.findCheckStatusDivByName = function (attr) {
        return this.findEditfilterLiByName(attr).$('div[ng-click="sideBar.checkUncheck($event,value)"]');
    }
};

function contentFilter() {
    var filterEle = '#filter';
    this.htmlElement = $(filterEle);
    this.clearAllBtn = this.htmlElement.element(by.cssContainingText('div.filter-item.ng-scope > a', 'Clear All Filters'));
    this.displayedFilters = this.htmlElement.all(by.css('div.filter-item.ng-scope:not(.ng-hide)'));
    this.clickClearAllBtn = function () {
        this.clearAllBtn.click();
    };
    this.findFilterWrapperByName = function (attrName) {
        return this.htmlElement.element(by.cssContainingText('div.filter-item.ng-scope:not(.ng-hide)', attrName))
    };
    this.clickFilterWrapperCancelByName = function (attrName) {
        this.findFilterWrapperByName(attrName).$('a.filter-link-cancel').click();
    };
    this.findCheckedSubfiltersByName = function (attrName) {
        return this.findFilterWrapperByName(attrName).all(by.css('span.filter-item-value.ng-scope > span'));
    }
};

function resultContent() {
    this.resultAllRows = element.all(by.repeater('row in FacetsData.ermrestData'));
    this.resultTally = element.all(by.css('#results_tally')).get(1);
    this.resultTallyRange = this.resultTally.element(by.binding("facetResults.displayRange()"));
    this.resultTallySum = this.resultTally.element(by.binding("FacetsData.totalServerItems"));
    this.filter = new contentFilter();
    //ele is element found using resultAllRows.get(idx);
    this.getResultTitleElement = function (ele) {
        return ele.$('span.panel-title.ng-binding');
    };
    this.getResultImgElement = function (ele) {
        return ele.$('img');
    };
    this.getResultInvestigatorElement = function (ele) {
        return ele.element(by.cssContainingText('dt.ng-binding', 'Investigator'));
    };
    this.getResultInvestigatorContent = function (ele) {
        var investEle = this.getResultInvestigatorElement(ele);
        return toolkit.getSiblingByCss(investEle, 'dd');
    };
    this.getResultSummaryElement = function (ele) {
        return ele.element(by.cssContainingText('dt.ng-binding', 'Summary'));
    };
    this.getResultSummaryContent = function (ele) {
        var summaryEle = this.getResultSummaryElement(ele);
        return toolkit.getSiblingByCss(summaryEle, 'dd');
    }
};

function recordPage() {
    this.entityTitle = $('#entity-title');
    this.findEntityKeyByName = function (entityName) {
        return element(by.cssContainingText('.entity-key.ng-binding', entityName));
    };
    this.findToggleByName = function (keyName) {
        return element(by.cssContainingText('.panel-heading', keyName))
    };
};

function chaisePage() {
    this.sidebar = new sidebar();
    this.moreFilter = new moreFilter();
    this.editFilter = new editFilter();
    this.resultContent = new resultContent();
    this.recordPage = new recordPage();
    this.tools = new tools();
    this.customExpect = {
        elementContainClass: function (ele, className) {
            expect(ele.getAttribute('class')).toContain(className);
        },
    };
};

module.exports = new chaisePage();
