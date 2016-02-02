/**
 * Wrapper for page actions (ex. click)
 * Created by shuai on 2/2/16.
 */

var page = require('./chaise.page.js');
var EC = protractor.ExpectedConditions;

function pageActions() {
    //load Chaise page so that following specs can be tested
    this.loadChaise = function() {
        browser.get('');
        //browser.ignoreSynchronization = true;
        var sidebar = element(by.id('sidebar'));
        browser.wait(EC.visibilityOf(sidebar), 10000).then(function () {
            expect(sidebar.isDisplayed()).toBe(true);
        });
    };

    this.clickSidebar = function(attrName) {
        var sidebarAttr = page.sidebar.findSidebarAttrByName(attrName);
        sidebarAttr.click();
    };

    this.clickEditFilter = function(attr) {
        var attrLabel = page.editFilter.findEditfilterAttrByName(attr);
        attrLabel.click();
    };
};

module.exports = new pageActions();