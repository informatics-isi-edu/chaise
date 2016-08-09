var chaisePage = require('../../../utils/chaise.page.js'), IGNORE = "tag:isrd.isi.edu,2016:ignore", HIDDEN = "tag:misd.isi.edu,2015:hidden";
var record2Helpers = require('../helpers.js');

describe('View existing record,', function() {  

	var params, testConfiguration = browser.params.configuration.tests, testParams = testConfiguration.params;
    
    for (var i=0; i< testParams.tables.length; i++) {
    	
    	(function(tableParams, index) {

    		describe("For table " + table.table_name + ",", function() {

    			var table, record;

				beforeAll(function () {
					browser.ignoreSyncronization = true;
					var keys = [];
					tableParams.keys.forEach(function(key) {
						keys.push(key.name + key.operator + key.value);
					});
					browser.get(browser.params.url + ":" + tableParams.table_name + "/" + keys.join("&"));
					table = browser.params.defaultSchema.content.tables[tableParams.table_name];
					browser.sleep(2000);
			    });

				describe("Presentation ,", function() {
					var params = record2Helpers.testPresentation(tableParams);
				});

    		});

    	})(testParams.tables[i], i);


    }

});
