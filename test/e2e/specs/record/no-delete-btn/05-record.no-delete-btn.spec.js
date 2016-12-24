var chaisePage = require('../../../utils/chaise.page.js');
var recordHelpers = require('../helpers.js');

describe('View existing record,', function() {

	var params, testConfiguration = browser.params.configuration.tests, testParams = testConfiguration.params;

    for (var i=0; i< testParams.tuples.length; i++) {

    	(function(tupleParams, index) {

    		describe("For table " + tupleParams.table_name + ",", function() {

    			var table, record;

				beforeAll(function(done) {
					var keys = [];
					tupleParams.deleteKeys.forEach(function(key) {
						keys.push(key.name + key.operator + key.value);
					});
					browser.ignoreSynchronization=true;
                    var url = browser.params.url + ":" + tupleParams.table_name + "/" + keys.join("&");
					browser.get(url);
					table = browser.params.defaultSchema.content.tables[tupleParams.table_name];
					chaisePage.waitForElement(element(by.id('tblRecord'))).then(function() {
                        done();
                    });
			    });

			    it("should load chaise-config.js and have confirmDelete=true and dataBrowser=''", function() {
			        browser.executeScript("return chaiseConfig;").then(function(chaiseConfig) {
			        	expect(chaiseConfig.confirmDelete).toBe(true);
                        expect(chaiseConfig.dataBrowser).toBe("");
			        });
				});

                it('should not display a delete record button', function() {
                    var deleteBtn = chaisePage.recordPage.getDeleteRecordButton();
                    expect(deleteBtn.isPresent()).toBeFalsy();
                });

    		});

    	})(testParams.tuples[i], i);


    }

});
