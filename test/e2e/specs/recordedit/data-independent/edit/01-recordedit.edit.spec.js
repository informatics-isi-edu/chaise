var chaisePage = require('../../../../utils/chaise.page.js'), IGNORE = "tag:isrd.isi.edu,2016:ignore", HIDDEN = "tag:misd.isi.edu,2015:hidden";
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
                    var updatedRecords = {}, keys = [], hasErrors = false;

					beforeAll(function() {
                        // Build the keys component of a url for checking:
                        // - This row in DB
                        // - Whether record app is on the right url
                        tableParams.keys.forEach(function(key) {
                            keys.push(key.name + key.operator + key.value);
                        });

						// Submit the form
						chaisePage.recordEditPage.submitForm();

                        // Get the set of info you're about to submit.
                        // Later we'll check whether this info is accurately reflected in the DB/Record app.
                        chaisePage.recordEditPage.getSubmissionModelRows().then(function(records) {
                            updatedRecords = records;
                        });
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

                    it('should have updated the DB with the submitted values', function() {
                        var url = process.env.ERMREST_URL + '/catalog/' + browser.params.catalogId + '/entity/' + browser.params.schema.name + ':' + tableParams.table_name + '/' + keys.join('&'),
                            authCookie = process.env.AUTH_COOKIE,
                            ermRest = require('../../../../../../../ermrestjs/build/ermrest.js');
                        ermRest.setUserCookie(authCookie);
                        ermRest.resolve(url, {cid: 'chaise-e2e-test'}).then(function(ref) {
                            return ref.contextualize.entryEdit.read(1);
                        }).then(function(page) {
                            // Sort and compare what was submitted in RecEdit with what's in ERMrest
                            updatedRecords.forEach(function(record, index) {
                                expect(angular.equals(record, page.tuples[index]._data)).toBe(true);
                            });
                        });
                    });

					it("should redirect to Record page", function(done) {
						if (!hasErrors) {
                            var redirectUrl = browser.params.url.replace('/recordedit/', '/record/');
                            redirectUrl += ':' + tableParams.table_name + '/' + keys.join('&');
                            // Wait for #tblRecord on Record page to appear
                            chaisePage.waitForElement(element(by.id('tblRecord'))).then(function() {
                                expect(browser.driver.getCurrentUrl()).toBe(redirectUrl);
                                done();
                            }, function() {
                                expect('Expected Record page to load an entity table').toBe('but the wait timed out.');
                                done();
                            });
						}
					});
				});

    		});

    	})(testParams.tables[i], i);
    }
    xdescribe('submitting the form without making any changes', function() {
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
        	var recordPage = chaisePage.recordPage,
                redirectUrl = browser.params.url.replace('/recordedit/', '/record/');

            redirectUrl += ':' + tableParams.table_name + '/' + keys.join('&');
            browser.pause();

        	chaisePage.waitForUrl(redirectUrl, browser.params.defaultTimeout).then(function() {
                expect(browser.driver.getCurrentUrl()).toBe(redirectUrl);
            }, function() {
            	console.log("          Timed out while waiting for the url to be the new one");
            	expect(browser.driver.getCurrentUrl()).toBe(redirectUrl);
            });
        });
    });
});
