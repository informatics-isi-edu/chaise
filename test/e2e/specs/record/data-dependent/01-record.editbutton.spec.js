var chaisePage = require('../../../utils/chaise.page.js');
var recordHelpers = require('../helpers.js');

describe('View existing record,', function() {

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
					browser.ignoreSynchronization=true;
					browser.get(browser.params.url + ":" + tupleParams.table_name + "/" + keys.join("&"));
					table = browser.params.defaultSchema.content.tables[tupleParams.table_name];
					browser.sleep(browser.params.defaultTimeout);
			    });

				it('should load chaise-config.js and have editRecord=true', function() {
			        browser.executeScript('return chaiseConfig;').then(function(chaiseConfig) {
			        	expect(chaiseConfig.editRecord).toBe(true);
			        });
				});

                describe("Click the edit record button ,", function() {
                	var params = recordHelpers.testEditButton(tupleParams);
				});

    		});

    	})(testParams.tuples[i], i);


    }

});
