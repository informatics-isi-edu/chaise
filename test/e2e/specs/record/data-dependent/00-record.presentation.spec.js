var chaisePage = require('../../../utils/chaise.page.js'), IGNORE = "tag:isrd.isi.edu,2016:ignore", HIDDEN = "tag:misd.isi.edu,2015:hidden";
var recordHelpers = require('../helpers.js');

describe('View existing record,', function() {

	var params, testConfiguration = browser.params.configuration.tests, testParams = testConfiguration.params;

    for (var i=0; i< testParams.tuples.length; i++) {

    	(function(tupleParams, index) {

    		describe("For table " + tupleParams.table_name + ",", function() {

    			var table, record;

				beforeAll(function() {
					var keys = [];
					tupleParams.keys.forEach(function(key) {
						keys.push(key.name + key.operator + key.value);
					});
                    browser.ignoreSynchronization=true;
                    var url = browser.params.url + ":" + tupleParams.table_name + "/" + keys.join("&");
					browser.get(url);
					table = browser.params.defaultSchema.content.tables[tupleParams.table_name];
                    var start = (new Date()).getTime();
                    chaisePage.waitForElement(element(by.id('tblRecord'))).then(function() {
                        console.log((new Date()).getTime() - start);
                    });
			    });

                it('should load document title defined in chaise-config.js and have deleteRecord=true', function() {
                    browser.executeScript("return chaiseConfig;").then(function(chaiseConfig) {
                        expect(chaiseConfig.deleteRecord).toBe(true);
                        if (chaiseConfig.headTitle) {
                            browser.getTitle().then(function(title) {
                                expect(title).toEqual(chaiseConfig.headTitle);
                            });
                        }
                    });
                });

				describe("Presentation ,", function() {
					var params = recordHelpers.testPresentation(tupleParams);
				});

    		});

    	})(testParams.tuples[i], i);
    }

    it('should load custom CSS and document title defined in chaise-config.js', function() {
        var chaiseConfig, tupleParams = testParams.tuples[0], keys = [];
        tupleParams.keys.forEach(function(key) {
            keys.push(key.name + key.operator + key.value);
        });
        var url = browser.params.url + ":" + tupleParams.table_name + "/" + keys.join("&");
        browser.get(url);
        chaisePage.waitForElement(element(by.id('tblRecord'))).then(function() {
            return browser.executeScript('return chaiseConfig');
        }).then(function(config) {
            chaiseConfig = config;
            return browser.executeScript('return $("link[href=\'' + chaiseConfig.customCSS + '\']")');
        }).then(function(elemArray) {
            expect(elemArray.length).toBeTruthy();
            return browser.getTitle();
        }).then(function(title) {
            expect(title).toEqual(chaiseConfig.headTitle);
        });
    });
});
