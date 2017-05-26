var chaisePage = require('../../../utils/chaise.page.js');
var testParams = {
    table_name: "accommodation",
    key: {
        name: "id",
        value: "2002",
        operator: "="
    }
};

describe('Add a record,', function() {

    describe("For table " + testParams.table_name + ",", function() {

        var record;

        beforeAll(function () {
            var keys = [];
            keys.push(testParams.key.name + testParams.key.operator + testParams.key.value);

            browser.ignoreSynchronization = true;
            browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/product-no-serial:" + testParams.table_name + "/" + keys.join("&"));
        });

        xit("the delete button should be disabled during submission and re-enabled after a conflict error.", function() {
            var EC = protractor.ExpectedConditions,
            deleteBtn = chaisePage.recordEditPage.getDeleteRecordButton(),
            submitBtn = chaisePage.recordEditPage.getSubmitRecordButton();

            chaisePage.waitForElement(element(by.id("submit-record-button"))).then(function() {

                return chaisePage.recordEditPage.getInputForAColumn("id", 0);
            }).then(function(idInput) {
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
