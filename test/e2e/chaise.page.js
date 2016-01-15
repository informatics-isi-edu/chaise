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
        sidebarAttrsDisplayed: element.all(by.css(sidebarId + ' ul.sidebar-nav li.ng-scope:not(.ng-hide)')),
        sidebarHeader: element(by.css(sidebarId + ' #navcontainer h4')),
        viewMoreBtn: element(by.cssContainingText(sidebarId + ' li a', 'View all attributes')),
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
    };
};

module.exports = new chaisePage();
