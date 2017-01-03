var recordsetHelpers = require('../helpers.js'), chaisePage = require('../../../utils/chaise.page.js');;

describe('View recordset,', function() {

    var testConfiguration = browser.params.configuration.tests, testParams = testConfiguration.params;

    for (var i=0; i< testParams.tuples.length; i++) {

        (function(tupleParams, index) {

            describe("For table " + tupleParams.table_name + ",", function() {

                beforeAll(function (done) {
                    var keys = [];
                    tupleParams.keys.forEach(function(key) {
                        keys.push(key.name + key.operator + key.value);
                    });
                    browser.ignoreSynchronization=true;
                    browser.get(browser.params.url + ":" + tupleParams.table_name + "/" + keys.join("&") + "@sort(" + tupleParams.sortby + ")");
                    
                    chaisePage.waitForElement(element(by.id("divRecordSet"))).finally(function() {
                        done();
                    });
                });

                describe("Presentation ,", function() {
                    var params = recordsetHelpers.testPresentation(tupleParams);
                });

            });

        })(testParams.tuples[i], i);


    }

    it('should load custom CSS and document title defined in chaise-config.js', function() {
        var chaiseConfig, tupleParams = testParams.tuples[0], keys = [];
        tupleParams.keys.forEach(function(key) {
            keys.push(key.name + key.operator + key.value);
        });
        var url = browser.params.url + ":" + tupleParams.table_name + "/" + keys.join("&") + "@sort(" + tupleParams.sortby + ")";
        browser.get(url);
        chaisePage.waitForElement(element(by.id('page-title')), browser.params.defaultTimeout).then(function() {
            return browser.executeScript('return chaiseConfig');
        }).then(function(config) {
            chaiseConfig = config;
            return browser.executeScript('return $("link[href=\'' + chaiseConfig.customCSS + '\']")');
        }).then(function(elemArray) {
            expect(elemArray.length).toBeTruthy();
            return browser.getTitle();
        }).then(function(title) {
            expect(title).toEqual(chaiseConfig.headTitle);
        }).catch(function(error) {
            console.log('ERROR:', error);
            // Fail the test
            expect('There was an error in this promise chain.').toBe('See the error msg for more info.');
        });
    });

});
