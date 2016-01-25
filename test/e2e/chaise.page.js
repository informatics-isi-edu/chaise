/**
 *
 * Created by shuai on 1/14/16.
 */

var sidebarId= '#sidebar';
var moreFilterId= '#morefilters';
var editFilterId= '#editfilter';

function chaisePage() {
    this.sidebar = {
        htmlElement: element(sidebarId),
        searchInput: element(by.css(sidebarId + ' div.search-box > input')),
        sidebarAttrsDisplayed: element.all(by.css(sidebarId + ' ul.sidebar-nav li.ng-scope:not(.ng-hide)')),
        sidebarHeader: element(by.css(sidebarId + ' #navcontainer h4')),
        viewMoreBtn: element(by.cssContainingText(sidebarId + ' li a', 'View all attributes')),
        findSidebarAttrsByName: function (attrName) {
            return element.all(by.cssContainingText(sidebarId + ' ul li a', attrName));
        },
        findSidebarAttrByName: function (attrName) {
            return element(by.cssContainingText(sidebarId + ' ul li a', attrName));
        },
    };
    this.moreFilter = {
        htmlElement: element(by.css(moreFilterId)),
        sidebarHeader: element(by.css(moreFilterId + ' div.sidebar-title h4')),
        findMorefilterAttrByName: function (attrName) {
            return element(by.cssContainingText(moreFilterId + ' div.editvalue-container' +
                ' div[ng-repeat="facet in FacetsData.facets"] label', attrName));
        },
    };
    this.editFilter = {
        htmlElement: element(by.css(editFilterId)),
        sidebarHeader: element(by.css(editFilterId + ' div.sidebar-title h4')),
        displayedEditAttrs: element.all(by.css(editFilterId + ' ul.nav.filteritems li.ng-scope:not(.ng-hide)')),
        findEditfilterAttrByName: function (attrName) {
            return element(by.cssContainingText(editFilterId + ' ul.nav.filteritems li.ng-scope:not(.ng-hide) label', attrName));
        },
        findEditfilterLiByName: function (attrName) {
            return element(by.cssContainingText(editFilterId + ' ul.nav.filteritems li.ng-scope:not(.ng-hide)', attrName));
        },
    };
    this.resultContent = {
        resultAllRows: element.all(by.repeater('row in FacetsData.ermrestData')),
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
};

module.exports = new chaisePage();
