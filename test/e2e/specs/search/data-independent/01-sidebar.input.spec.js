/**
 * Created by shuai on 2/2/16.
 */

var chaisePage = require('../../../utils/chaise.page.js');

describe('Sidebar top search input,', function () {
    var EC = protractor.ExpectedConditions;

    beforeAll(function () {
        browser.ignoreSynchronization=true;
        browser.get(browser.params.url || "");
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
