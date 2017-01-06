var chaisePage = require('../../../../utils/chaise.page.js');
var recordEditHelpers = require('../../helpers.js');

describe('Edit existing record,', function() {

	var testConfiguration = browser.params.configuration.tests, testParams = testConfiguration.params.multi_edit;

    describe("when the user edits 2 records at a time, ", function() {

        beforeAll(function () {
            var keys = [];
            tableParams.keys_2.forEach(function(key) {
                keys.push(key.name + key.operator + key.value);
            });
            browser.ignoreSynchronization = true;
            browser.get(browser.params.url + ":" + testParams.table_name + "/" + keys.join("&"));
        });

        it("should change their values and show a resultset table with 2 entities.", function() {
            chaisePage.waitForElement(element(by.id("submit-record-button"))).then(function() {

            });
        });
    });

    describe("when the user edits 3 records at a time, ", function() {

        beforeAll(function () {
            var keys = [];
            tableParams.keys_3.forEach(function(key) {
                keys.push(key.name + key.operator + key.value);
            });
            browser.ignoreSynchronization = true;
            browser.get(browser.params.url + ":" + testParams.table_name + "/" + keys.join("&"));
        });

        it("should change their values and show a resultset table with 3 entities.", function() {
            chaisePage.waitForElement(element(by.id("submit-record-button"))).then(function() {

            });
        });
    });
});
