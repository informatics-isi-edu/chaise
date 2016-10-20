var chaisePage = require('../../../../utils/chaise.page.js');
var recordEditHelpers = require('../../helpers.js');

describe('Edit existing record,', function() {

	var params, testConfiguration = browser.params.configuration.tests, testParams = testConfiguration.params;

    for (var i=0; i< testParams.tables.length; i++) {

    	(function(tableParams, index) {

    		describe("For table " + table.table_name + ",", function() {

    			var table, record;

				beforeAll(function () {
					var keys = [];
					tableParams.delete_keys.forEach(function(key) {
						keys.push(key.name + key.operator + key.value);
					});
					browser.ignoreSynchronization=true;
					browser.get(browser.params.url + ":" + tableParams.table_name + "/" + keys.join("&"));
					table = browser.params.defaultSchema.content.tables[tableParams.table_name];

					browser.sleep(3000);
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

                describe("delete existing record ", function () {
                    it("should load chaise-config.js and nhave confirmDelete=true and dataBrowser=''", function () {
                        browser.executeScript("return chaiseConfig;").then(function(chaiseConfig) {
    			        	expect(chaiseConfig.confirmDelete).toBe(true);
                            expect(chaiseConfig.dataBrowser).toBe("");
    			        });
                    });

                    it("from recordedit page and redirect to data browser.", function () {
                        var EC = protractor.ExpectedConditions,
                            modalTitle = chaisePage.recordPage.getConfirmDeleteTitle(),
                            config;

                        browser.executeScript('return chaiseConfig;').then(function(chaiseConfig) {
                            config = chaiseConfig;

                            return chaisePage.recordEditPage.getDeleteRecordButton().click()
                        }).then(function () {
                            browser.wait(EC.visibilityOf(modalTitle), 5000);
                            // expect modal to open
                            return modalTitle.getText();
                        }).then(function (text) {
                            expect(text).toBe("Confirm Delete");

                            return chaisePage.recordPage.getConfirmDeleteButton().click();
                        }).then(function () {
                            browser.driver.sleep(1000);

                            return browser.driver.getCurrentUrl();
                        }).then(function(url) {
                            var parts = url.split("/");

                            expect(parts.length).toBe(4);
                            expect(parts[3]).toBe(config.dataBrowser);
                        });
                    });
                });
            });
        })(testParams.tables[i], i);
    }
});
