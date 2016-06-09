/**
 * Created by shuai on 2/2/16.
 */

var chaisePage = require('../chaise.page.js');

describe('Sidebar top search input,', function () {
    var EC = protractor.ExpectedConditions;

    beforeAll(function (done) {
        browser.get(browser.params.url || "");
        var sidebar = element(by.id('sidebar'));
        browser.wait(EC.visibilityOf(sidebar), 10000).then(function () {
            done();
        });

    });
    var searchBox = chaisePage.sidebar.searchInput;
    var displayedAttrs = chaisePage.sidebar.sidebarAttrsDisplayed;

    var initAttrNum;
    it('should show >0 attributes when in initial state', function () {
        displayedAttrs.count().then(function (num) {
            expect(num).toBeGreaterThan(0);
            initAttrNum = num;
        });
    });

    var meaninglessTxt = 'hellogoodbye';
    it('should input meaningless text and wait for seconds', function (done) {
        searchBox.sendKeys(meaninglessTxt);
        searchBox.sendKeys(protractor.Key.BACK_SPACE);
        setTimeout(function () {
            done();
        }, 4000);
    });

    it('should show 0 attribute when searching for meaningless input', function () {
        expect(displayedAttrs.count()).toBe(0);
    });

    it('should show attributes of initial size', function () {
        for (var i = 0; i < meaninglessTxt.length; i++) {
            //hit back space several times to clear input and wait for AJAX
            searchBox.sendKeys(protractor.Key.BACK_SPACE);
        };
        expect(displayedAttrs.count()).toBe(initAttrNum);
    });

});
