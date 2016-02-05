/**
 * Created by shuai on 2/2/16.
 */

var chaisePage = require('../chaise.page.js');
var pageAction = require('../page.action.js');

describe('Sidebar top search input,', function () {
    var EC = protractor.ExpectedConditions;

    it('should load the page correctly', function (done) {
        pageAction.loadChaise();
        done();
    });

    var searchBox = chaisePage.sidebar.searchInput;
    var displayedAttrs = chaisePage.sidebar.sidebarAttrsDisplayed;

    var initAttrNum;
    it('should show >0 attributes when in initial state', function (done) {
        displayedAttrs.count().then(function (num) {
            expect(num).toBeGreaterThan(0);
            initAttrNum = num;
            done();
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

    it('should show 0 attribute when searching for meaningless input', function (done) {
        expect(displayedAttrs.count()).toBe(0);
        done();
    });

    it('should show attributes of initial size', function (done) {
        for (var i = 0; i < meaninglessTxt.length; i++) {
            //hit back space several times to clear input and wait for AJAX
            searchBox.sendKeys(protractor.Key.BACK_SPACE);
        };
        expect(displayedAttrs.count()).toBe(initAttrNum);
        done();
    });

    var RNA = 'RNA';
    it('should show \'Experiment Type\' filters containing \'RNA\' when searching for \'RNA\'', function (done) {
        searchBox.sendKeys(RNA);
        var experimentTypeText = 'Experiment Type';
        chaisePage.sidebar.clickSidebarAttr(experimentTypeText);
        var displayedEditAttrs = chaisePage.editFilter.displayedEditAttrs;
        displayedEditAttrs.count().then(function (num) {
            for (var i = 0; i < num; i++) {
                displayedEditAttrs.get(i).getText().then(function (txt) {
                    expect(txt.toUpperCase()).toContain(RNA);
                });
            }
            done();
        });
    });

    it('should show \'Data Type\' filters containing \'RNA\' when searching for \'RNA\'', function (done) {
        var dataType = 'Data Type';
        chaisePage.editFilter.goBackToSidebar();
        chaisePage.sidebar.clickSidebarAttr(dataType);
        var displayedEditAttrs = chaisePage.editFilter.displayedEditAttrs;
        displayedEditAttrs.count().then(function (num) {
            for (var i = 0; i < num; i++) {
                displayedEditAttrs.get(i).getText().then(function (txt) {
                    expect(txt.toUpperCase()).toContain(RNA);
                });
            }
            done();
        });
    });

    it('should clear input and show attributes of initial size', function (done) {
        for (var i = 0; i < RNA.length; i++) {
            //hit back space several times to clear input and wait for AJAX
            searchBox.sendKeys(protractor.Key.BACK_SPACE);
        };
        expect(displayedAttrs.count()).toBe(initAttrNum);
        done();
    });

});
