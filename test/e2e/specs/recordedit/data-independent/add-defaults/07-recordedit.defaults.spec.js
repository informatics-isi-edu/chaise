var chaisePage = require('../../../../utils/chaise.page.js');
var recordEditHelpers = require('../../helpers.js');

describe('Record Add', function() {

    var testConfiguration = browser.params.configuration.tests, testParams = testConfiguration.params;

    describe("for when the user adds multiple forms using the multi form input control, ", function() {
        var EC = protractor.ExpectedConditions;

        var index;

        beforeAll(function () {
            browser.ignoreSynchronization=true;
            browser.get(browser.params.url + ":" + testParams.table_name);
            browser.sleep(browser.params.defaultTimeout);
        });
