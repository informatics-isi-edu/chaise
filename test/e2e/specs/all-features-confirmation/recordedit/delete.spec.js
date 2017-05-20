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

                    chaisePage.waitForElement(element(by.id("submit-record-button"))).then(function() {
                        return chaisePage.recordEditPage.getViewModelRows()
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

                describe("delete existing record ", function () {
                    it("should load chaise-config.js and have confirmDelete=true and dataBrowser=''", function () {
                        browser.executeScript("return chaiseConfig;").then(function(chaiseConfig) {
    			        	expect(chaiseConfig.confirmDelete).toBe(true);
                            expect(chaiseConfig.dataBrowser).toBe("");
    			        });
                    });

                    it("should display a modal when attempting to delete a record that has been modified by someone else beforehand", function() {
                        var EC = protractor.ExpectedConditions, allWindows;
                        // Set up a mismatching ETag scenario before attempting delete to ensure that
                        // that the delete operation doesn't throw a 412 error when ETags are mismatching
                        // but the referenced tuples haven't changed from the tuples in the DB.
                        var modalTitle = chaisePage.recordPage.getConfirmDeleteTitle(),
                            config;

                        // Edit the current record in a new tab in order to change the ETag
                        // - Open current url in a new tab
                        browser.driver.getCurrentUrl().then(function(url) {
                            return browser.executeScript('window.open(arguments[0]);', url);
                        }).then(function() {
                            return browser.getAllWindowHandles();
                        }).then(function(handles) {
                            allWindows = handles;
                            return browser.switchTo().window(allWindows[1]);
                        }).then(function() {
                            // In order to simulate someone else modifying a record (in order to
                            // trigger a 412), we should set RecEdit's window.opener to null so
                            // that RecordSet won't think that this RecEdit page was opened by the same user
                            // from the original page.
                            return browser.executeScript('window.opener = null');
                        }).then(function() {
                            return chaisePage.waitForElement(element(by.id("submit-record-button")));
                        }).then(function() {
                        // - Change a small thing. Submit.
                            var input = chaisePage.recordEditPage.getInputById(0, 'Summary');
                            input.clear();
                            input.sendKeys('as;dkfa;sljk als;dkj f;alsdjf a;');
                            return chaisePage.recordEditPage.getSubmitRecordButton().click();
                        }).then(function(handles) {
                        // - Go back to initial RecordEdit page
                            browser.close();
                            browser.switchTo().window(allWindows[0]);
                        }).then(function() {
                            return chaisePage.recordEditPage.getDeleteRecordButton().click()
                        }).then(function () {
                            browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);
                            // expect modal to open
                            return modalTitle.getText();
                        }).then(function (text) {
                            expect(text).toBe("Confirm Delete");
                            return chaisePage.recordPage.getConfirmDeleteButton().click();
                        }).then(function () {
                            // Expect another modal to appear to tell user that this record cannot be deleted without page refresh.
                            var refreshBtn = element(by.id('refresh-btn'));
                            chaisePage.waitForElement(refreshBtn);
                            return refreshBtn.click();
                        }).then(function() {
                            return chaisePage.waitForElement(element(by.id('submit-record-button')));
                        }).then(function() {
                            changedValue = chaisePage.recordEditPage.getInputById(0, 'Summary');
                            expect(changedValue.getAttribute('value')).toBe('as;dkfa;sljk als;dkj f;alsdjf a;');
                        }).catch(function(error) {
                            console.dir(error);
                            expect(error).not.toBeDefined();
                        });
                    });

                    it("from recordedit page and redirect to data browser.", function () {
                        var EC = protractor.ExpectedConditions,
                            modalTitle = chaisePage.recordPage.getConfirmDeleteTitle(),
                            config, redirectUrl;

                        browser.executeScript('return chaiseConfig;').then(function(chaiseConfig) {
                            config = chaiseConfig;
                            return chaisePage.recordEditPage.getDeleteRecordButton().click()
                        }).then(function () {
                            browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);
                            // expect modal to open
                            return modalTitle.getText();
                        }).then(function (text) {
                            expect(text).toBe("Confirm Delete");

                            return chaisePage.recordPage.getConfirmDeleteButton().click();
                        }).then(function () {
                            redirectUrl = process.env.CHAISE_BASE_URL + "/search/";

                            browser.wait(function () {
                                return browser.driver.getCurrentUrl().then(function(url) {
                                    return url.startsWith(redirectUrl);
                                })
                            });

                            return browser.driver.getCurrentUrl();
                        }).then(function (url) {
                            expect(url.startsWith(redirectUrl)).toBe(true);
                        });
                    });
                });
            });
        })(testParams.tables[i], i);
    }
});
