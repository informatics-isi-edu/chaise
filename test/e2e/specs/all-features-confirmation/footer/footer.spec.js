var chaisePage = require('../../../utils/chaise.page.js');
var appName = ['recordedit','recordset'],
EC = protractor.ExpectedConditions;
describe('Page Footer', function() {
            appName.forEach(function(val){
                var flocation = "/" + val + "/#" + browser.params.catalogId + "/"+browser.params.defaultTable.schema_name+":" + browser.params.defaultTable.table_name;
                (function(location, appPage){
                describe('Checking footer in ' + appPage +' page:', function() {
                    beforeAll(function() {
                        browser.ignoreSynchronization = true;
                        url = browser.params.url + location;
                        browser.get(url);
                        footerMain = element(by.id('footer'));
                        browser.wait(EC.visibilityOf(footerMain),browser.params.defaultTimeout,'No footer');
                    });

                    it('Page footer link should match with "privacy-policy"', function() {
                        var footerLink = element(by.id('footer')).element(by.tagName('a'));
                        chaisePage.waitForElementCondition(EC.visibilityOf(footerLink));
                        footerLink.getAttribute('href').then(function(prevLink) {
                            var plink = prevLink.slice(0, -1);
                            expect(plink.substring(plink.lastIndexOf('/') + 1)).toBe("privacy-policy", "Privacy Policy is not defined. Check chaise-config.js")
                        })
                    })

                });
            })(flocation,val);
        });
});
