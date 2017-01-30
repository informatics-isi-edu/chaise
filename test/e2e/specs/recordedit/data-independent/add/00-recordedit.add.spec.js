var chaisePage = require('../../../../utils/chaise.page.js');
var recordEditHelpers = require('../../helpers.js'), chance = require('chance').Chance();

describe('Record Add', function() {

    var params, testConfiguration = browser.params.configuration.tests, testParams = testConfiguration.params;

    for (var i=0; i< testParams.tables.length; i++) {

    	(function(tableParams, index) {

    		describe("======================================================================= \n    "
    			+ tableParams.records + " record(s) for table " + tableParams.table_name + ",", function() {

				beforeAll(function () {
					browser.ignoreSynchronization=true;
					browser.get(browser.params.url + ":" + tableParams.table_name);
                    chaisePage.waitForElement(element(by.id("submit-record-button")));
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
                            // doesn't redirect to record
                            if (tableParams.records > 1) {
                                // wait for url change
                                browser.wait(function () {
                                    return browser.driver.getCurrentUrl().then(function(url) {
                                        return url.startsWith(process.env.CHAISE_BASE_URL + "/recordedit/");
                                    });
                                }, browser.params.defaultTimeout);
                                // verify url and ct
                                browser.driver.getCurrentUrl().then(function(url) {
    						        expect(url.startsWith(process.env.CHAISE_BASE_URL + "/recordedit/")).toBe(true);

                                    chaisePage.recordsetPage.getRows().count().then(function (ct) {
                                        expect(ct).toBe(tableParams.records);
                                    });
                                });
                            // redirects to record
						    } else {
                                // wait for url change
                                browser.wait(function () {
                                    return browser.driver.getCurrentUrl().then(function(url) {
                                        return url.startsWith(process.env.CHAISE_BASE_URL + "/record/");
                                    });
                                }, browser.params.defaultTimeout);
                                // cerify url
                                browser.driver.getCurrentUrl().then(function(url) {
                                    expect(url.startsWith(process.env.CHAISE_BASE_URL + "/record/")).toBe(true);
                                });
						    }
						}
					});
				});
    		});
    	})(testParams.tables[i], i);
    }

    it('should load custom CSS and document title defined in chaise-config.js', function() {
        var chaiseConfig;
        browser.get(browser.params.url + ":" + testParams.tables[0].table_name);
        chaisePage.waitForElement(element(by.id("submit-record-button"))).then(function() {
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

    describe('When url has a prefill query string param set, ', function() {
        var testCookie = {};
        beforeAll(function() {
            // Refresh the page
            browser.get(browser.params.url + ":" + testParams.tables[0].table_name);
            browser.sleep(100);

            // Write a dummy cookie for creating a record in Accommodation table
            testCookie = {
                constraintName: 'product:fk_category', // A FK that Accommodation table has with Category table
                rowname: chance.sentence(),
                keys: {id: 1}
            };
            browser.manage().addCookie('test', JSON.stringify(testCookie));

            // Reload the page with prefill query param in url
            browser.get(browser.params.url + ":" + testParams.tables[0].table_name + '?prefill=test');
        });

        it('should pre-fill fields from the prefill cookie', function() {
            chaisePage.waitForElement(element(by.id("submit-record-button"))).then(function() {
                return browser.manage().getCookie('test');
            }).then(function(cookie) {
                if (cookie) {
                    var field = element.all(by.css('.popup-select-value')).first();
                    expect(field.getText()).toBe(testCookie.rowname);
                } else {
                    // Fail the test
                    expect('Cookie did not load').toEqual('but cookie should have loaded');
                }
            });
        });

        afterAll(function() {
            browser.manage().deleteCookie('test');
        });
    });

});
