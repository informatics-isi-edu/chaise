var chaisePage = require('../../../../utils/chaise.page.js'), IGNORE = "tag:isrd.isi.edu,2016:ignore", HIDDEN = "tag:misd.isi.edu,2015:hidden";
var recordEditHelpers = require('../../helpers.js');

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
                        return chaisePage.recordEditPage.getRecordModelRows();
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

				describe("Submitting an existing record", function() {
					beforeAll(function() {
						// Submit the form
						chaisePage.recordEditPage.submitForm();
					});

					var hasErrors = false;

					it("should have no errors, and should be redirected", function() {
						chaisePage.recordEditPage.getAlertError().then(function(err) {
							if (err) {
								expect("Page has errors").toBe("No errors");
								hasErrors = true;
							} else {
								expect(true).toBe(true);
							}
						});
					});

					it("should be redirected to record page", function() {
						if (!hasErrors) {
                            var keys = [];
                            tableParams.keys.forEach(function(key) {
                                keys.push(key.name + key.operator + key.value);
                            });

                            var redirectUrl = browser.params.url.replace('/recordedit/', '/record/');
                            redirectUrl += ':' + tableParams.table_name + '/' + keys.join('&');

                            chaisePage.waitForUrl(redirectUrl, browser.params.defaultTimeout).then(function() {
                                expect(browser.driver.getCurrentUrl()).toBe(redirectUrl);
                            }, function() {
                            	console.log("          Timed out while waiting for the url to be the new one");
                            	expect(browser.driver.getCurrentUrl()).toBe(redirectUrl);
						    });
						}
					});
				});

    		});

    	})(testParams.tables[i], i);
    }
    describe('and submitting the form without making any changes', function() {
        var keys = [], tableParams = testParams.tables[0];
        beforeAll(function() {
            tableParams.keys.forEach(function(key) {
                keys.push(key.name + key.operator + key.value);
            });
            browser.ignoreSynchronization=true;
            browser.get(browser.params.url + ":" + tableParams.table_name + "/" + keys.join("&"));

            chaisePage.waitForElement(element(by.id("submit-record-button")), browser.params.defaultTimeout).then(function() {
            	chaisePage.recordEditPage.submitForm();
            });
        });

        it('should also redirect to the correct Record page', function() {
        	var redirectUrl = browser.params.url.replace('/recordedit/', '/record/');
            redirectUrl += ':' + tableParams.table_name + '/' + keys.join('&');

        	chaisePage.waitForUrl(redirectUrl, browser.params.defaultTimeout).then(function() {
                expect(browser.driver.getCurrentUrl()).toBe(redirectUrl);
            }, function() {
            	console.log("          Timed out while waiting for the url to be the new one");
            	expect(browser.driver.getCurrentUrl()).toBe(redirectUrl);
            });
        });
    });
});
