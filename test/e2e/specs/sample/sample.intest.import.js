
var chaisePage = require('../../utils/chaise.page.js');

var testConfiguration = require('../../data_setup/config/search.dev.json');
testConfiguration.authCookie = process.env.AUTH_COOKIE;

var pImport = require('../../utils/protractor.import.js'), catalogId;

var beforeTestRun = function(EC) {
    beforeAll(function (done) {

        pImport.setup(testConfiguration).then(function(data) {

            var url = process.env.CHAISE_BASE_URL + '/search';

            chaisePage.setAuthCookie(url, testConfiguration.authCookie);
            
            if (data.catalogId) {

                catalogId = data.catalogId;
                // set the url for testcases to stat using the catalogId and schema that was mentioned in the configuration
                url = browser.baseUrl + "/#" + data.catalogId + "/schema/" + data.schema.name;
            }

            browser.get(url || browser.params.url);

            var sidebar = element(by.id('sidebar'));
            browser.wait(EC.visibilityOf(sidebar), 10000).then(function () {
                done();
            });
        }, function(err) {
            pImport.tear(testConfiguration, catalogId).then(function() {
                throw err
            }, function(err) {
                throw err;
            });
        });
    });

};

var afterTestRun = function() {
    afterAll(function (done) {
        pImport.tear(testConfiguration, catalogId).then(function() {
            done();
        }, function(err) {
            throw err;
        })
    });
};

describe('Sidebar top search input,', function () {
    var EC = protractor.ExpectedConditions;

    beforeTestRun(EC);
    
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

    afterTestRun();
});
