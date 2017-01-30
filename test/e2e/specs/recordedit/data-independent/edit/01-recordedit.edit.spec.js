var chaisePage = require('../../../../utils/chaise.page.js');
var recordEditHelpers = require('../../helpers.js');
var mustache = require('../../../../../../../ermrestjs/vendor/mustache.min.js');

describe('Edit existing record,', function() {

	var params, testConfiguration = browser.params.configuration.tests, testParams = testConfiguration.params;

    for (var i=0; i< testParams.tables.length; i++) {

    	(function(tableParams, index) {

    		describe("For table " + table.table_name + ",", function() {

    			var table, record;

				beforeAll(function () {
					var keys = [];
					tableParams.keys.forEach(function(key) {
						keys.push(key.name + key.operator + key.value);
					});
					browser.ignoreSynchronization=true;
					browser.get(browser.params.url + ":" + tableParams.table_name + "/" + keys.join("&"));
					table = browser.params.defaultSchema.content.tables[tableParams.table_name];

                    chaisePage.waitForElement(element(by.id("submit-record-button"))).then(function() {
                        return chaisePage.recordEditPage.getViewModelRows();
                    }).then(function(records) {
			        	browser.params.record = record = records[0];
			        	table.column_definitions.forEach(function(c) {
			        		if (record[c.name]) {
			        			if (c.type.typename !== "date" && c.type.typename !== "timestamptz") {
				        		 	c._value =  record[c.name] + "";
				        		}
			        		}
			        	});
			        });
			    });


				describe("Presentation and validation,", function() {
                    var params = recordEditHelpers.testPresentationAndBasicValidation(tableParams);
				});

				describe("Submitting an existing record,", function() {
                    var keys = [], hasErrors = false;

					beforeAll(function() {
                        // Build the keys component of a url for checking whether record app is on the right url
                        tableParams.keys.forEach(function(key) {
                            keys.push(key.name + key.operator + key.value);
                        });

						// Submit the form
						chaisePage.recordEditPage.submitForm();
					});

					it("should have no errors", function() {
						chaisePage.recordEditPage.getAlertError().then(function(err) {
							if (err) {
								expect("Page has errors").toBe("No errors");
								hasErrors = true;
							} else {
								expect(true).toBe(true);
							}
						});
					});

					it("should redirect to Record page", function() {
						if (!hasErrors) {
                            var redirectUrl = browser.params.url.replace('/recordedit/', '/record/');
                            redirectUrl += ':' + tableParams.table_name + '/' + keys.join('&');
                            // Wait for #tblRecord on Record page to appear
                            chaisePage.waitForElement(element(by.id('tblRecord'))).then(function() {
                                expect(browser.driver.getCurrentUrl()).toBe(redirectUrl);
                            }, function() {
                                expect('Expected Record page to load an entity table').toBe('but the wait timed out.');
                            });
						}
					});
				});

    		});

    	})(testParams.tables[i], i);
    }
});
