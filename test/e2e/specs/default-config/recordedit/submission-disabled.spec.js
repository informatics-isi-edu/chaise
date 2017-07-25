var chaisePage = require('../../../utils/chaise.page.js');
var testParams = {
    table_name: "submission-disabled-table",
    key: {
        name: "id",
        value: "1000",
        operator: "="
    }
};

describe('Add a record,', function() {

    describe("For table " + testParams.table_name + ",", function() {

        var record,
            submitBtn;

        beforeAll(function () {
            var keys = [];
            keys.push(testParams.key.name + testParams.key.operator + testParams.key.value);

            browser.ignoreSynchronization = true;
            browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/submission-disabled:" + testParams.table_name + "/" + keys.join("&"));

            submitBtn = chaisePage.recordEditPage.getSubmitRecordButton();
            chaisePage.waitForElement(submitBtn);
        });

        // NOTE: adding this test here because eventually we are going to change the behavior
        // of updating an entity with no changes. Currently the update function throws an error,
        // whereas, later we will be disabling the submission button until changes were made in the form
        it("warn the user when submitting data when no data was changed.", function() {
            chaisePage.recordEditPage.submitForm();

            browser.wait(function() {
                return chaisePage.recordEditPage.getAlertWarning();
            }, browser.params.defaultTimeout).then(function(error) {
                return error.getText();
            }).then(function(text) {
                expect(text.indexOf("Warning No data was changed in the update request. Please check the form content and resubmit the data.")).toBeGreaterThan(-1, "The alert warning message was incorrect");
            });
        });

        xit("the delete button should be disabled during submission and re-enabled after a conflict error.", function() {
            var EC = protractor.ExpectedConditions,
                deleteBtn = chaisePage.recordEditPage.getDeleteRecordButton();


            chaisePage.recordEditPage.getInputForAColumn("id", 0).then(function(idInput) {
                chaisePage.recordEditPage.clearInput(idInput);
                browser.sleep(10);

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
});
