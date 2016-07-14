var chaisePage = require('../../chaise.page.js'), IGNORE = "tag:isrd.isi.edu,2016:ignore", HIDDEN = "tag:misd.isi.edu,2015:hidden";
var recordEditHelpers = require('../helpers.js');

describe('Edit existing record,', function() {  

	var params, testConfiguration = browser.params.configuration.tests, testParams = testConfiguration.params;
    
    for (var i=0; i< testParams.tables.length; i++) {
    	
    	(function(tableParams, index) {

    		describe("For table " + table.table_name + ",", function() {

    			var table, record;

				beforeAll(function () {
					browser.ignoreSyncronization = true;
					var keys = [];
					tableParams.keys.forEach(function(key) {
						keys.push(key.name + key.operator + key.value);
					});
					browser.get(browser.params.url + ":" + tableParams.table_name + "/" + keys.join("&"));
					table = browser.params.defaultSchema.content.tables[tableParams.table_name];
					browser.sleep(2000);
			        browser.executeScript("chaiseConfig.editRecord = true;");
			        browser.executeScript("$('.modal').remove();$('.modal-backdrop').remove();$('body').removeClass('modal-open')");

			        chaisePage.recordEditPage.getRecordModelRows().then(function(records) {
			        	browser.params.record = record = records[0];
			        	table.column_definitions.forEach(function(c) {
			        		if (record[c.name]) {
			        			if (c.type.typename !== "date" && c.type.typename !== "timestamptz") {
				        		 	c._value =  record[c.name] + "";
				        		}
			        		}
			        	});
			        });
			        browser.sleep(100);
			    });

				describe("Presentation and validation,", function() {
					var params = recordEditHelpers.testPresentationAndBasicValidation(tableParams);
				});

				describe("Submit existing record", function() {
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
							browser.sleep(2000);
							browser.driver.getCurrentUrl().then(function(url) {
						        expect(url.startsWith(process.env.CHAISE_BASE_URL + "/record/")).toBe(true);
						        console.log(url);
						    });
						}
					});

				});

    		});

    	})(testParams.tables[i], i);


    }

});
