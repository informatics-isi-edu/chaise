var chaisePage = require('../../../../utils/chaise.page.js');
var recordEditHelpers = require('../../helpers.js');

describe('Add a record,', function() {

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

					browser.ignoreSynchronization = true;
					browser.get(browser.params.url + ":" + tableParams.table_name + "/" + keys.join("&"));
					table = browser.params.defaultSchema.content.tables[tableParams.table_name];
					browser.sleep(browser.params.defaultTimeout);
			    });

                xit("the delete button should be disabled during submission and re-enabled after a conflict error.", function() {
                    var EC = protractor.ExpectedConditions,
                        deleteBtn = chaisePage.recordEditPage.getDeleteRecordButton(),
                        submitBtn = chaisePage.recordEditPage.getSubmitRecordButton();

                    chaisePage.recordEditPage.getInputForAColumn("id", 0).then(function(idInput) {
                        chaisePage.recordEditPage.clearInput(idInput);
                        browser.sleep(browser.params.defaultTimeout);

                        idInput.sendKeys("2001");
                        expect(idInput.getAttribute('value')).toBe("2001");

                        // continue running code while $http request is processed. Submit and delete should be disabled while data is being processed
                        // TODO proxy the request and set a delay on that proxy
                        browser.ignoreSynchronization = false;
                        chaisePage.recordEditPage.submitForm();

                        // expect(submitBtn.isEnabled()).toBe(false);
                        browser.wait(EC.not(EC.elementToBeClickable(deleteBtn)), browser.params.defaultTimeout);
                        expect(deleteBtn.isEnabled()).toBe(false);


                        // browser.wait(EC.elementToBeClickable(submitBtn), browser.params.defaultTimeout);
                        // expect(submitBtn.isEnabled()).toBeTruthy();
                        // expect(deleteBtn.isEnabled()).toBeTruthy();
                    });
                }).pend("Marked pending until we decide how to throttle requests for chaise");

            });
        })(testParams.tables[i], i);
    }
});
