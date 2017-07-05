var chaisePage = require('./../../utils/chaise.page.js');
// var mustache = require('../../../../ermrestjs/vendor/mustache.min.js');
var chaiseConfig = {
    name: "Footer",
    apps:['record','recordedit','recordset'],
    defaultTables: {
        "1": {
            "schema": "isa",
            "table": "dataset",
            "id": "269"
        }
    }
};
var EC = protractor.ExpectedConditions;
describe('Page Footer', function() {
        // browser.executeScript('return chaiseConfig').then(function(chaiseConfig) {

            chaiseConfig.apps.forEach(function(val){
            // for(i=0;i<chaiseConfig.apps.length;i++){
                // let val = chaiseConfig.apps[i];
                let flocation = "/" + val + "/#1/" + chaiseConfig.defaultTables[1].schema + ":" + chaiseConfig.defaultTables[1].table + "/id=" + chaiseConfig.defaultTables[1].id;
                //exeTest(fileLocation);
                (function(location, appPage){

                describe('Checking footer in ' + appPage +' page:', function() {
                    // console.log("Loc: "+location);
                    //browser.pause();
                    beforeAll(function() {
                        browser.ignoreSynchronization = true;
                        url = browser.params.url + location;
                        console.log(url);
                        browser.get(url);
                        footerMain = element(by.id('footerStyle'));
                        chaisePage.waitForElementCondition(EC.visibilityOf(footerMain));
                        browser.sleep(3000);
                        // done();
                    });
                    it('Page footer should appear at the bottom of the page', function() {
                        // var footerMain = element(by.id('footerStyle'));
                        // chaisePage.waitForElementCondition(EC.visibilityOf(footerMain));

                        browser.executeScript('return $(document).height()').then(function(docH) {
                            console.log(docH);
                            docHeight = docH;
                            return footerMain.getLocation();
                        }).then(function(loc) {
                            elemLoc = loc.y;
                            console.log(elemLoc);
                            return footerMain.getSize();
                        }).then(function(elemH) {
                            console.log(elemH.height);
                            let totalH = elemLoc + elemH.height;
                            expect(totalH).toEqual(docHeight, 'Footer is not at the bottom of the page!');
                        }).catch(function(error) {
                            console.dir(error);
                            expect('Something went wrong in this promise chain').toBe('Please see error message.', 'While checking footer position on the page.');
                        });
                    });

                    it('Page footer link should match with "privacy-policy"', function() {
                        var footerLink = element(by.id('footerStyle')).element(by.tagName('a'));
                        chaisePage.waitForElementCondition(EC.visibilityOf(footerLink));
                        footerLink.getAttribute('href').then(function(prevLink) {
                            let plink = prevLink.slice(0, -1);
                            expect(plink.substring(plink.lastIndexOf('/') + 1)).toBe("privacy-policy", "Privacy Policy is not defined. Check chaise-config.js")
                        })
                    })

                });
            })(flocation,val);
        });
});
