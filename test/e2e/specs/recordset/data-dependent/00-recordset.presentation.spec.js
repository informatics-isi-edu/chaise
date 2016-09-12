var chaisePage = require('../../../utils/chaise.page.js'), IGNORE = "tag:isrd.isi.edu,2016:ignore", HIDDEN = "tag:misd.isi.edu,2015:hidden";
var recordsetHelpers = require('../helpers.js');

describe('View recordset,', function() {

    var params, testConfiguration = browser.params.configuration.tests, testParams = testConfiguration.params;

    for (var i=0; i< testParams.tuples.length; i++) {

        (function(tupleParams, index) {

            describe("For table " + tupleParams.table_name + ",", function() {

                var table, record;

                beforeAll(function () {
                    var keys = [];
                    tupleParams.keys.forEach(function(key) {
                        keys.push(key.name + key.operator + key.value);
                    });
                    browser.get(browser.params.url + ":" + tupleParams.table_name + "/" + keys.join("&") + "@sort(" + tupleParams.sortby + ")");
                    browser.sleep(2000);
                });

                describe("Presentation ,", function() {
                    var params = recordsetHelpers.testPresentation(tupleParams);
                });

            });

        })(testParams.tuples[i], i);


    }

});
