var chaisePage = require('../../../utils/chaise.page.js');
var recordHelpers = require('../helpers.js');

describe('View existing record,', function() {

    var params, testConfiguration = browser.params.configuration.tests, testParams = testConfiguration.params;

    for (var i=0; i< testParams.tuples.length; i++) {

        (function(tupleParams, index) {

            describe("For table " + tupleParams.table_name + ",", function() {

                var table, record;

                beforeAll(function(done) {
                    var keys = [];
                    tupleParams.keys.forEach(function(key) {
                        keys.push(key.name + key.operator + key.value);
                    });
                    browser.ignoreSynchronization=true;
                    var url = browser.params.url + ":" + tupleParams.table_name + "/" + keys.join("&");
                    browser.get(url);
                    table = browser.params.defaultSchema.content.tables[tupleParams.table_name];
                    chaisePage.waitForElement(element(by.id('tblRecord'))).then(function() {
                        done();
                    });
                });

                describe("Show the related entity tables,", function() {
                    var params = recordHelpers.relatedTableActions(testParams, tupleParams);
                });

            });

        })(testParams.tuples[i], i);


    }

});
