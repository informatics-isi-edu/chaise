var chaisePage = require('../../../utils/chaise.page.js');
var testParams = {
    table_name: "submission-disabled-table",
    key: {
        name: "id",
        value: "1000",
        operator: "="
    },
    conflict_table_name: "duplicate_key_conflict",
    conflict_column: "duplicate_id",
    conflict_key: "1000",
    conflict_message: "Error The entry cannot be created/updated. Please use a different duplicate_id for this record. Click here to see the conflicting record that already exists."
};

describe("For error handling strategies on submission,", function() {

    describe("when editing a record without changing data,", function() {

        beforeAll(function () {
            var keys = [];
            keys.push(testParams.key.name + testParams.key.operator + testParams.key.value);

            browser.ignoreSynchronization = true;
            browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/submission-disabled:" + testParams.table_name + "/" + keys.join("&"));

            chaisePage.recordeditPageReady();
        });

        // NOTE: adding this test here because eventually we are going to change the behavior
        // of updating an entity with no changes. Currently the update function throws an error,
        // whereas, later we will be disabling the submission button until changes were made in the form
        it("warn the user when submitting data when no data was changed.", function(done) {
            chaisePage.recordEditPage.submitForm().then(() => {
                const alert = chaisePage.recordEditPage.getAlertWarning();
                return chaisePage.waitForElement(alert);
            }).then(() => {
                done();
                expect(alert.getText()).toEqual("Warning No data was changed in the update request. Please check the form content and resubmit the data.");
            }).catch(chaisePage.catchTestError(done));
        });
    });

    describe("when creating a record,", function() {

        var uri;

        beforeAll(function () {
            browser.ignoreSynchronization = true;
            uri = browser.params.url + "/recordedit/#" + browser.params.catalogId + "/submission-disabled:" + testParams.conflict_table_name;
            browser.get(uri);

            chaisePage.recordeditPageReady();
        });

        it("a conflict error should show an alert with a link to the conflicting record.", function(done) {
            chaisePage.recordEditPage.getInputForAColumn(testParams.conflict_column, 0).then(function(idInput) {
                idInput.sendKeys(testParams.conflict_key);
                expect(idInput.getAttribute('value')).toBe(testParams.conflict_key, "input does not show the correct value");

                return chaisePage.recordEditPage.submitForm();
            }).then(function () {
                return browser.wait(function() { return chaisePage.recordEditPage.getAlertError(); }, browser.params.defaultTimeout);
            }).then(function(alert) {
                expect(alert.getText()).toContain(testParams.conflict_message, "alert message is incorrect");

                var duplicate_uri = uri.replace('recordedit', 'record') + '/' + testParams.conflict_column + '=' + testParams.conflict_key;
                expect(chaisePage.recordEditPage.getAlertErrorLinkHref()).toContain(duplicate_uri, "link to duplicate record is incorrect");

                done();
            }).catch(chaisePage.catchTestError(done));
        });
    });
});
