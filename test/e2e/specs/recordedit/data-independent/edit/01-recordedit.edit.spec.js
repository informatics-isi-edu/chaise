var chaisePage = require('../../../../utils/chaise.page.js'), IGNORE = "tag:isrd.isi.edu,2016:ignore", HIDDEN = "tag:misd.isi.edu,2015:hidden";
var recordEditHelpers = require('../../helpers.js');
var mustache = require('../../../../../../../ermrestjs/vendor/mustache.min.js');

describe('Edit existing record,', function() {

	var params, testConfiguration = browser.params.configuration.tests, testParams = testConfiguration.params;

    // for (var i=0; i< testParams.tables.length; i++) {
    //
    // 	(function(tableParams, index) {
    //
    // 		describe("For table " + table.table_name + ",", function() {
    //
    // 			var table, record;
    //
	// 			beforeAll(function () {
	// 				var keys = [];
	// 				tableParams.keys.forEach(function(key) {
	// 					keys.push(key.name + key.operator + key.value);
	// 				});
	// 				browser.ignoreSynchronization=true;
	// 				browser.get(browser.params.url + ":" + tableParams.table_name + "/" + keys.join("&"));
	// 				table = browser.params.defaultSchema.content.tables[tableParams.table_name];
    //
    //                 chaisePage.waitForElement(element(by.id("submit-record-button"))).then(function() {
    //                     return chaisePage.recordEditPage.getRecordModelRows();
    //                 }).then(function(records) {
	// 		        	browser.params.record = record = records[0];
	// 		        	table.column_definitions.forEach(function(c) {
	// 		        		if (record[c.name]) {
	// 		        			if (c.type.typename !== "date" && c.type.typename !== "timestamptz") {
	// 			        		 	c._value =  record[c.name] + "";
	// 			        		}
	// 		        		}
	// 		        	});
	// 		        });
	// 		    });
    //
    //
	// 			describe("Presentation and validation,", function() {
    //                 var params = recordEditHelpers.testPresentationAndBasicValidation(tableParams);
	// 			});
    //
	// 			describe("Submitting an existing record", function() {
	// 				beforeAll(function() {
	// 					// Submit the form
	// 					chaisePage.recordEditPage.submitForm();
	// 				});
    //
	// 				var hasErrors = false;
    //
	// 				it("should have no errors, and should be redirected", function() {
	// 					chaisePage.recordEditPage.getAlertError().then(function(err) {
	// 						if (err) {
	// 							expect("Page has errors").toBe("No errors");
	// 							hasErrors = true;
	// 						} else {
	// 							expect(true).toBe(true);
	// 						}
	// 					});
	// 				});
    //
	// 				it("should be redirected to record page", function() {
	// 					if (!hasErrors) {
    //                         var keys = [];
    //                         tableParams.keys.forEach(function(key) {
    //                             keys.push(key.name + key.operator + key.value);
    //                         });
    //
    //                         var redirectUrl = browser.params.url.replace('/recordedit/', '/record/');
    //                         redirectUrl += ':' + tableParams.table_name + '/' + keys.join('&');
    //
    //                         chaisePage.waitForUrl(redirectUrl, browser.params.defaultTimeout).then(function() {
    //                             expect(browser.driver.getCurrentUrl()).toBe(redirectUrl);
    //                         }, function() {
    //                         	console.log("          Timed out while waiting for the url to be the new one");
    //                         	expect(browser.driver.getCurrentUrl()).toBe(redirectUrl);
	// 					    });
	// 					}
	// 				});
	// 			});
    //
    // 		});
    //
    // 	})(testParams.tables[i], i);
    // }
    describe('submitting the form without making any changes', function() {
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
            // Wait for tblRecord to appear..
            chaisePage.waitForElement(element(by.id('tblRecord'))).then(function() {
                var columns = tableParams.columns.filter(function(c) {return c.value != null;});
                // Count the number of rows... are they the same num as in the record?
                recordPage.getColumns().then(function(elems) {
                    expect(elems.length).toBe(columns.length);
                });

                recordPage.getAllColumnCaptions().then(function(pageColumns) {
                    expect(pageColumns.length).toBe(columns.length);
                    var index = 0;
                    pageColumns.forEach(function(c) {
                        c.getText().then(function(txt) {
                            txt = txt.trim();
                            var col = columns[index++];
                            expect(txt).toBe(col.title);
                        });
                    });
                });
                // Check each row... is each row's name and value the same? See testPresentationAndBasicValidation fns..
                chaisePage.recordPage.getColumnValueElements().then(function(colVals) {
                    expect(colVals.length).toBe(columns.length);
        			var index = 0, columnUrl, aTag;
        			colVals.forEach(function(el) {
        				var column = columns[index++];
                        if (column.presentation && column.presentation.type == "url") {
                            chaisePage.recordPage.getLinkChild(el).then(function(aTag) {
                                columnUrl = mustache.render(column.presentation.template, {
                                    "catalog_id": process.env.catalogId,
                                    "chaise_url": process.env.CHAISE_BASE_URL,
                                });

                                expect(aTag.getAttribute('href')).toEqual(columnUrl);
                                expect(aTag.getText()).toEqual(column.value);
                            });
                        } else {
                            expect(el.getText()).toBe(column.value);
                        }
        			});
        		});
            });

        	chaisePage.waitForUrl(redirectUrl, browser.params.defaultTimeout).then(function() {
                expect(browser.driver.getCurrentUrl()).toBe(redirectUrl);
            }, function() {
            	console.log("          Timed out while waiting for the url to be the new one");
            	expect(browser.driver.getCurrentUrl()).toBe(redirectUrl);
            });
        });
    });
});
