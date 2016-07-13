var chaisePage = require('../../chaise.page.js'), IGNORE = "tag:isrd.isi.edu,2016:ignore", HIDDEN = "tag:misd.isi.edu,2015:hidden";
var recordEditHelpers = require('../helpers.js');


describe('Edit existing record,', function() {  

	var params, testConfiguration = browser.params.configuration.tests, testParams = testConfiguration.params;
    
    for (var i=0; i< testParams.tables.length; i++) {
    	
    	(function(tableParams, index) {

    		describe(testParams.tables[index].records + " record(s) for table " + table.table_name + ",", function() {

    			var table;

				beforeAll(function () {
					browser.ignoreSyncronization = true;
					var keys = [];
					tableParams.keys.forEach(function(key) {
						keys.push(key.name + key.operator + key.value);
					});
					browser.get(browser.params.url + ":" + tableParams.table_name + "/" + keys.join("&"));
					browser.params.table = table = browser.params.defaultSchema.content.tables[tableParams.table_name];
					browser.sleep(2000);
			        browser.executeScript("chaiseConfig.editRecord = true;");
			        browser.executeScript("$('.modal').remove();$('.modal-backdrop').remove();$('body').removeClass('modal-open')");
			    });

				describe("Presentation and validation,", function() {
					var params = recordEditHelpers.testPresentationAndBasicValidation(tableParams);
				});

    		});

    	})(testParams.tables[i], i);


    }

});
