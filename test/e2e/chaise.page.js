/**
 *
 * Created by shuai on 1/14/16.
 */

var chaisePage = {
    sidebar: {
        htmlElement: element(by.css('#sidebar')),
        sidebarAttrsDisplayed: element.all(by.css('#sidebar ul.sidebar-nav li.ng-scope:not(.ng-hide)')),
    },
    moreFilters: {
        htmlElement: element(by.css('#morefilters')),
    },
    editFilters: {
        htmlElement: element(by.css('#morefilters')),
    },
};

module.exports = chaisePage;
