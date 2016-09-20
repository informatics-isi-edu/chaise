var chaisePage = require('../../../utils/chaise.page.js'), IGNORE = "tag:isrd.isi.edu,2016:ignore", HIDDEN = "tag:misd.isi.edu,2015:hidden";
var viewerHelpers = require('../helpers.js');

describe('Viewer app', function() {

    var params, testConfiguration = browser.params.configuration.tests, testParams = testConfiguration.params;

    for (var i=0; i< testParams.tuples.length; i++) {

    	(function(tupleParams, index) {

    		describe("For table " + tupleParams.table_name + ",", function() {

    			var table, record;

				beforeAll(function () {
					var keys = [];
					tupleParams.keys.forEach(function(key) {
						keys.push(key.name + key.operator + key.value);
					});
					browser.get(browser.params.url + ":" + tupleParams.table_name + "/" + keys.join("&"));
					table = browser.params.defaultSchema.content.tables[tupleParams.table_name];
					browser.sleep(2000);
			    });

                // Commented out because no specs to test presentation just yet
				// describe("Presentation ,", function() {
				// 	var params = record2Helpers.testPresentation(tupleParams);
				// });

    		});

    	})(testParams.tuples[i], i);


    }
    it('should load custom CSS and document title defined in chaise-config.js', function() {
        var chaiseConfig = browser.executeScript('return chaiseConfig');
        if (chaiseConfig.customCSS) {
            expect($("link[href='" + chaiseConfig.customCSS + "']").length).toBeTruthy();
        }
        if (chaiseConfig.headTitle) {
            browser.getTitle().then(function(title) {
                expect(title).toEqual(chaiseConfig.headTitle);
            });
        }
    });
});
