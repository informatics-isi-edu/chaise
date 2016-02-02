/**
 *
 * Created by shuai on 2/2/16.
 */

var chaisePage = require('../chaise.page.js');
var pageAction = require('../page.action.js');

xdescribe('search_04 test', function() {
    describe('on load', function () {
        it('should display sidebar', function(done) {
            pageAction.loadChaise();
            done();
        });

        it('should click sidebar', function(done) {
            pageAction.clickSidebar('Data Type');
            var head = chaisePage.editFilter.sidebarHeader;
            expect(head.getText()).toBe('DATA TYPE');
            done();
        });

        it('should click label', function (done) {
            pageAction.clickEditFilter('Enhancer reporter data');
            var filterWrapper = chaisePage.resultContent.filter.findFilterWrapperByName('Data Type');
            expect(filterWrapper.isDisplayed()).toBe(true);
            done();
        });
    });
});
