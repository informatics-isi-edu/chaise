var chaisePage = require('../../../../utils/chaise.page.js');
var recordEditHelpers = require('../../helpers.js');

describe('Add a record,', function() {

	var params, testConfiguration = browser.params.configuration.tests, testParams = testConfiguration.params;

    for (var i=0; i< testParams.tables.length; i++) {

    	(function(tableParams, index) {

    		describe("For table " + table.table_name + ",", function() {

    			var table, record;

				beforeAll(function () {
					browser.ignoreSynchronization=true;
					browser.get(browser.params.url + ":" + tableParams.table_name);
					table = browser.params.defaultSchema.content.tables[tableParams.table_name];
					browser.sleep(browser.params.defaultTimeout);
			    });

                describe("Presentation and validation for an entity with a composite key,", function() {

                    it("the composite key should be filled in.", function() {
                        var modalTitle = chaisePage.recordEditPage.getModalTitle(),
                        	EC = protractor.ExpectedConditions;

                        chaisePage.recordEditPage.getModalPopupBtnsUsingScript().then(function(popupBtns) {

                            return chaisePage.clickButton(popupBtns[3]);
                        }).then(function() {
                            // wait for the modal to open
                            browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);

                            return modalTitle.getText();
                        }).then(function(text) {
                            // make sure modal opened
                            expect(text.indexOf("Choose")).toBeGreaterThan(-1);

                            rows = chaisePage.recordsetPage.getRows();
                            // count is needed for clicking a random row
                            return rows.count();
                        }).then(function(ct) {
                            expect(ct).toBeGreaterThan(0);

                            var index = Math.floor(Math.random() * ct);
                            return rows.get(index).click();
                        }).then(function() {
                            browser.wait(EC.visibilityOf(chaisePage.recordEditPage.getFormTitle()), browser.params.defaultTimeout);

                            var foreignKeyInput = chaisePage.recordEditPage.getForeignKeyInputValue("Person", 0);
                            expect(foreignKeyInput.getAttribute("value")).toBeDefined();
                        });
                    });
                });

                describe("Submit record", function() {
					beforeAll(function() {
						// Submit the form
						chaisePage.recordEditPage.submitForm();
					});

					var hasErrors = false;

					it("should have no errors, and should be redirected", function(done) {
						chaisePage.recordEditPage.getAlertError().then(function(err) {
							if (err) {
								expect("Page has errors").toBe("No errors");
								hasErrors = true;
							} else {
								expect(true).toBe(true);
							}
						});
                        done();
					});

					it("should be redirected to record page", function() {
						if (!hasErrors) {
                            var EC = protractor.ExpectedConditions;

							browser.sleep(browser.params.defaultTimeout);
							browser.driver.getCurrentUrl().then(function(url) {
						        expect(url.startsWith(process.env.CHAISE_BASE_URL + "/record/")).toBe(true);

                                for (var i = 0; i < tableParams.column_names.length; i++) {
                                    var columnName = tableParams.column_names[i];
                                    var column = chaisePage.recordPage.getColumnValue(columnName);
                                    browser.wait(EC.visibilityOf(column), browser.params.defaultTimeout);
                                    expect(column.getAttribute("value")).toBeDefined();
                                }
						    });
						}
					});
				});

            });
        })(testParams.tables[i], i);
    }
});
