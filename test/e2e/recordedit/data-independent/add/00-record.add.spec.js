var chaisePage = require('../../../chaise.page.js'), IGNORE = "tag:isrd.isi.edu,2016:ignore", HIDDEN = "tag:misd.isi.edu,2015:hidden";
var recordEditHelpers = require('../../helpers.js');

describe('Record Add', function() {  

    var params, testConfiguration = browser.params.configuration.tests, testParams = testConfiguration.params;
    
    for (var i=0; i< testParams.tables.length; i++) {
    	
    	(function(tableParams, index) {
    		var table;

    		describe("======================================================================= \n    " 
    			+ tableParams.records + " record(s) for table " + tableParams.table_name + ",", function() {

				beforeAll(function (done) {
					browser.ignoreSyncronization = true;
					browser.get(browser.params.url + ":" + tableParams.table_name);
					table = browser.params.defaultSchema.content.tables[tableParams.table_name];
					if (process.env.TRAVIS) {
						browser.sleep(10000);
					} else {
						browser.sleep(3000);
						browser.executeScript("$('.modal').remove();$('.modal-backdrop').remove();$('body').removeClass('modal-open')");
					}
			    });

				describe("Presentation and validation,", function() {
					var params = recordEditHelpers.testPresentationAndBasicValidation(tableParams);
				});

				describe("delete record, ", function() {

					if (tableParams.records > 1) { 

						it(tableParams.records + " buttons should be visible and enabled", function() {
							chaisePage.recordEditPage.getAllDeleteRowButtons().then(function(buttons) {
								expect(buttons.length).toBe(tableParams.records + 1);
								buttons.forEach(function(btn) {
									expect(btn.isDisplayed()).toBe(true);
									expect(btn.isEnabled()).toBe(true);
								});
							});
						});

						var randomNo = chaisePage.recordEditPage.getRandomInt(0, tableParams.records - 1);

						it("click any delete button", function() {
							chaisePage.recordEditPage.getDeleteRowButton(randomNo).then(function(button)	 {
								chaisePage.clickButton(button);
								browser.sleep(50);
								chaisePage.recordEditPage.getDeleteModalButton().then(function(modalBtn) {
									chaisePage.clickButton(modalBtn);
									browser.sleep(50);
									chaisePage.recordEditPage.getAllDeleteRowButtons().then(function(buttons) {
										expect(buttons.length).toBe(tableParams.records);
									});
								});
							});
						});
					} else {
						it("zero delete buttons should be visible", function() {
							chaisePage.recordEditPage.getAllDeleteRowButtons().then(function(buttons) {
								expect(buttons.length).toBe(1);
								buttons.forEach(function(btn) {
									expect(btn.isDisplayed()).toBe(false);
								});
							});
						});
					}
				});

				describe("Submit " + tableParams.records + " records", function() {
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
							browser.sleep(3000);
							browser.driver.getCurrentUrl().then(function(url) {
								console.log(url);
						        if (tableParams.records > 1) {
						        	expect(url.startsWith(process.env.CHAISE_BASE_URL + "/recordset/")).toBe(true);
						        } else {
						        	expect(url.startsWith(process.env.CHAISE_BASE_URL + "/record/")).toBe(true);
						        }
						    });
						}
					});

				});

    		});

    	})(testParams.tables[i], i);

    }

});