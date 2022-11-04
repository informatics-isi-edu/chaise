var testConfiguration = browser.params.configuration;
var chaisePage = require('../../../utils/chaise.page.js');
var recordEditHelpers = require('../../../utils/recordedit-helpers.js'), chance = require('chance').Chance();
var exec = require('child_process').execSync;
var moment = require('moment');

// take a look at the comments in recordedit-helpers.js for the expected structure of tableParams.
var currentTimestampTime = moment().format("x");
var testParams = {
    tables: [{
        comment: "general case",
        schema_name: "product-add",
        table_name: "accommodation",
        table_displayname: "Accommodations",
        table_comment: "List of different types of accommodations",
        not_ci: true,
        primary_keys: ["id"],
        columns: [
            { name: "id", generated: true, immutable: true, title: "Id", type: "serial4", nullok: false},
            { name: "title", title: "Name of Accommodation", type: "text", nullok: false},
            { name: "website", title: "Website", type: "text", comment: "A valid url of the accommodation"},
            { name: "category", title: "Category", type: "text", nullok: false, isForeignKey: true,  count: 5, totalCount: 5, comment: "Type of accommodation ('Resort/Hotel/Motel')"}, // the total count is the total number of rows in the category.json data file
            { name: "rating", title: "User Rating", type: "float4", nullok: false},
            { name: "summary", title: "Summary", type: "longtext", nullok: false},
            { name: "description", title: "Description", type: "markdown"},
            { name: "json_col", title: "json_col", type:"json"},
            { name: "no_of_rooms", title: "Number of Rooms", type: "int2"},
            { name: "opened_on", title: "Operational Since", type: "timestamptz", nullok: false },
            { name: "date_col", title: "date_col", type: "date"},
            { name: "luxurious", title: "Is Luxurious", type: "boolean" },
            { name: "text_array", title: "text_array", type: "array", baseType: "text" },
            { name: "boolean_array", title: "boolean_array", type: "array", baseType: "boolean" },
            { name: "int4_array", title: "int4_array", type: "array", baseType: "integer" },
            { name: "float4_array", title: "float4_array", type: "array", baseType: "number" },
            { name: "date_array", title: "date_array", type: "array", baseType: "date" },
            { name: "timestamp_array", title: "timestamp_array", type: "array", baseType: "timestamp" },
            { name: "timestamptz_array", title: "timestamptz_array", type: "array", baseType: "timestamptz" },
            { name: "color_rgb_hex_column", title: "color_rgb_hex_column", type: "color", nullok: false }
        ],
        inputs: [
            {
                "title": "new title 1", "website": "https://example1.com", "category": {index: 0, value: "Hotel"},
                "rating": "1", "summary": "This is the summary of this column 1.", "description": "## Description 1",
                "json_col": JSON.stringify({"items": {"qty": 6,"product": "apple"},"customer": "Nitish Sahu"},undefined,2),
                "no_of_rooms": "1", "opened_on": moment("2017-01-01 01:01:01", "YYYY-MM-DD hh:mm:ss"), "date_col": "2017-01-01", "luxurious": false,
                "text_array": "[\"v1\", \"v2\"]", "boolean_array": "[true]", "int4_array": "[1, 2]", "float4_array": "[1, 2.2]",
                "date_array": "[\"2001-01-01\", \"2002-02-02\"]", "timestamp_array": "[null, \"2001-01-01T01:01:01\"]",
                "timestamptz_array": "[null, \"2001-01-01T01:01:01-08:00\"]",
                "color_rgb_hex_column": "#123456"
            },
            {
                "title": "new title 2", "website": "https://example2.com", "category": {index: 1, value: "Ranch"},
                "rating": "2",  "summary": "This is the summary of this column 2.", "description": "## Description 2",
                "json_col": JSON.stringify({"items": {"qty": 6,"product": "apple"},"customer": "Nitish Sahu"},undefined,2),
                "no_of_rooms": "2", "opened_on": moment("2017-02-02 02:02:02", "YYYY-MM-DD hh:mm:ss"), "date_col": "2017-02-02", "luxurious":  true,
                "text_array": "[\"v2\", \"v3\"]", "boolean_array": "[false]", "int4_array": "[1, 2]", "float4_array": "[2, 3.3]",
                "date_array": "[\"2002-02-02\", null]", "timestamp_array": "[\"2002-02-02T02:02:02\"]",
                "timestamptz_array": "[\"2002-02-02T02:02:02-08:00\"]",
                "color_rgb_hex_column": "#654321"
            }
        ],
        formsAfterInput: 3,
        result_columns: [
            "title", "website", "product-add_fk_category", "rating", "summary", "description",
            "json_col", "no_of_rooms", "opened_on", "date_col", "luxurious",
            "text_array", "boolean_array", "int4_array", "float4_array", "date_array", "timestamp_array", "timestamptz_array", "color_rgb_hex_column"
        ],
        results: [
            [
                "new title 1",  {"link":"https://example1.com/", "value":"Link to Website"}, {"link":"{{{chaise_url}}}/record/#{{catalog_id}}/product-add:category/term=Hotel", "value":"Hotel"},
                "1.0000", "This is the summary of this column 1.", "Description 1", JSON.stringify({"items": {"qty": 6,"product": "apple"},"customer": "Nitish Sahu"},undefined,2),
                "1", "2017-01-01 01:01:01", "2017-01-01", "false",
                "v1, v2", "true", "1, 2", "1.0000, 2.2000", "2001-01-01, 2002-02-02", "No value, 2001-01-01 01:01:01", "No value, 2001-01-01 01:01:01", "#123456"
            ],
            [
                "new title 2",  {"link":"https://example2.com/", "value":"Link to Website"}, {"link":"{{{chaise_url}}}/record/#{{catalog_id}}/product-add:category/term=Ranch", "value":"Ranch"},
                "2.0000", "This is the summary of this column 2.", "Description 2", JSON.stringify({"items": {"qty": 6,"product": "apple"},"customer": "Nitish Sahu"},undefined,2),
                "2", "2017-02-02 02:02:02", "2017-02-02", "true",
                "v2, v3", "false", "1, 2", "2.0000, 3.3000", "2002-02-02, No value", "2002-02-02 02:02:02", "2002-02-02 02:02:02", "#654321"
            ]
        ],
        files: []
    }, {
       comment: "uploading new files",
       schema_name: "product-add",
       table_name: "file",
       table_displayname: "file",
       table_comment: "asset/object",
       not_ci: !process.env.CI,
       primary_keys: ["id"],
       columns: [
           { name: "fileid", title: "fileid", type: "int4", skipValidation: true },
           { name: "uri", title: "uri", type: "text", isFile: true, comment: "asset/reference", skipValidation: true },
           { name: "timestamp_txt", title: "timestamp_txt", type: "text", skipValidation: true},
       ],
       inputs: [
           {"fileid": "1", "uri": 0, "timestamp_txt": currentTimestampTime},
           {"fileid": "2", "uri": 1, "timestamp_txt": currentTimestampTime},
           {"fileid": "3", "uri": 2, "timestamp_txt": currentTimestampTime, validate: true}
       ],
       formsAfterInput: 3,
       result_columns: [
           "fileid", "uri", "filename", "bytes"
       ],
       results: [
           ["1", {"link": "/hatrac/js/chaise/" + currentTimestampTime + "/1/.txt/3a8c740953a168d9761d0ba2c9800475:", "value": "testfile1MB.txt"}, "testfile1MB.txt", "1,024,000"],
           ["2", {"link": "/hatrac/js/chaise/" + currentTimestampTime + "/2/.png/2ada69fe3cdadcefddc5a83144bddbb4:", "value": "testfile500kb.png"}, "testfile500kb.png", "512,000"]
       ],
       files : [{
           name: "testfile1MB.txt",
           size: "1024000",
           displaySize: "1000 kB",
           path: "testfile1MB.txt",
           skipDeletion: true,
           tooltip: "- testfile1MB.txt\n- 1000 kB"
       }, {
           name: "testfile500kb.png",
           size: "512000",
           displaySize: "500 kB",
           path: "testfile500kb.png",
           skipDeletion: true,
           tooltip: "- testfile500kb.png\n- 500 kB"
       }, {
           name: "testfile5MB.txt",
           size: "5242880",
           displaySize: "5000 kB",
           path: "testfile5MB.txt",
           tooltip: "- testfile5MB.txt\n- 5 MB"
       }]
   }, {
      comment: "uploader when one file exists in hatrac and the other one is new",
      schema_name: "product-add",
      table_name: "file",
      table_displayname: "file",
      table_comment: "asset/object",
      not_ci: !process.env.CI,
      primary_keys: ["id"],
      columns: [
          { name: "fileid", title: "fileid", type: "int4", skipValidation: true },
          { name: "uri", title: "uri", type: "text", isFile: true, comment: "asset/reference", skipValidation: true },
          { name: "timestamp_txt", title: "timestamp_txt", type: "text", skipValidation: true},
      ],
      inputs: [
          {"fileid": "1", "uri": 0, "timestamp_txt": currentTimestampTime}, // this is a new file
          {"fileid": "2", "uri": 1, "timestamp_txt": currentTimestampTime}, // the uploaded file for this already exists (uploaded in the previou step)
          {"fileid": "3", "uri": 1, "timestamp_txt": currentTimestampTime} // this form won't be submitted
      ],
      formsAfterInput: 3,
      result_columns: [
          "fileid", "uri", "filename", "bytes"
      ],
      results: [
          ["1", {"link": "/hatrac/js/chaise/" + currentTimestampTime + "/1/.txt/b5dad28809685d9764dbd08fa23600bc:", "value": "testfile10MB_new.txt"}, "testfile10MB_new.txt", "10,240,000"],
          ["2", {"link": "/hatrac/js/chaise/" + currentTimestampTime + "/2/.png/2ada69fe3cdadcefddc5a83144bddbb4:", "value": "testfile500kb.png"}, "testfile500kb.png", "512,000"]
      ],
      files : [{
          name: "testfile10MB_new.txt", // a new file with new md5
          size: "10240000",
          displaySize: "9.77 MB",
          path: "testfile10MB_new.txt",
          tooltip: "- testfile10MB_new.txt\n- 9.77 MB"
      }, {
          name: "testfile500kb.png", // using the same file that has been already uploaded
          skipCreation: true,
          skipDeletion: true,
          size: "512000",
          displaySize: "500 kB",
          path: "testfile500kb.png",
          tooltip: "- testfile500kb.png\n- 500 kB"
      }]
   }, {
      comment: "uploader when all the files already exist in hatrac",
      schema_name: "product-add",
      table_name: "file",
      table_displayname: "file",
      table_comment: "asset/object",
      not_ci: !process.env.CI,
      primary_keys: ["id"],
      columns: [
          { name: "fileid", title: "fileid", type: "int4", skipValidation: true },
          { name: "uri", title: "uri", type: "text", isFile: true, comment: "asset/reference", skipValidation: true },
          { name: "timestamp_txt", title: "timestamp_txt", type: "text", skipValidation: true},
      ],
      inputs: [
          {"fileid": "1", "uri": 0, "timestamp_txt": currentTimestampTime}, // the uploaded file for this already exists (uploaded in the previou step)
          {"fileid": "2", "uri": 1, "timestamp_txt": currentTimestampTime}, // the uploaded file for this already exists (uploaded in the previou step)
          {"fileid": "3", "uri": 1, "timestamp_txt": currentTimestampTime} // this form won't be submitted
      ],
      formsAfterInput: 3,
      result_columns: [
          "fileid", "uri", "filename", "bytes"
      ],
      results: [
          ["1", {"link": "/hatrac/js/chaise/" + currentTimestampTime + "/1/.txt/3a8c740953a168d9761d0ba2c9800475:", "value": "testfile1MB.txt"}, "testfile1MB.txt", "1,024,000"],
          ["2", {"link": "/hatrac/js/chaise/" + currentTimestampTime + "/2/.png/2ada69fe3cdadcefddc5a83144bddbb4:", "value": "testfile500kb.png"}, "testfile500kb.png", "512,000"]
      ],
      files : [{
          name: "testfile1MB.txt", // using the same file that has been already uploaded
          skipCreation: true,
          size: "1024000",
          displaySize: "1000 kB",
          path: "testfile1MB.txt",
          tooltip: "- testfile1MB.txt\n- 1000 kB"
      }, {
          name: "testfile500kb.png", // using the same file that has been already uploaded
          skipCreation: true,
          size: "512000",
          displaySize: "500 kB",
          path: "testfile500kb.png",
          tooltip: "- testfile500kb.png\n- 500 kB"
      }]
   }]
};

// keep track of namespaces that we use, so we can delete them afterwards
if (!process.env.CI) {
    testConfiguration.hatracNamespaces.push(process.env.ERMREST_URL.replace("/ermrest", "") + "/hatrac/js/chaise/" + currentTimestampTime);
}

describe('Record Add', function() {

    for (var i=0; i< testParams.tables.length; i++) {
        (function(tableParams, index) {

            describe("======================================================================= \n    "
            + tableParams.inputs.length + " record(s) for table " + tableParams.table_name + " testing " + tableParams.comment + ",", function() {

                beforeAll(function () {
                    browser.ignoreSynchronization=true;

                    // if it's the same table-name, we have to reload. browser.get is not reloading the page
                    if (index > 0 && tableParams.table_name === testParams.tables[index-1].table_name) {
                        browser.navigate().refresh();
                    } else {
                        browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/"+tableParams.schema_name+":" + tableParams.table_name);
                    }
                    chaisePage.recordeditPageReady();
                });

                describe("Presentation and validation,", function() {

                    if (!process.env.CI && tableParams.files.length > 0) {
                        beforeAll(function() {
                            // create files that will be uploaded
                            recordEditHelpers.createFiles(tableParams.files);
                            console.log("\n");
                        });
                    }

                    var params = recordEditHelpers.testPresentationAndBasicValidation(tableParams, false);
                });

                describe("remove record, ", function() {

                    if (tableParams.inputs.length > 1) {

                        if (tableParams.files.length == 0) {
                            it("should click and add an extra record.", function(done) {
                                chaisePage.clickButton(chaisePage.recordEditPage.getMultiFormInputSubmitButton()).then(function () {
                                    done();
                                }).catch(chaisePage.catchTestError(done));
                            });
                        }

                        it((tableParams.formsAfterInput) + " buttons should be visible and enabled", function() {
                            chaisePage.recordEditPage.getAllDeleteRowButtons().then(function(buttons) {
                                expect(buttons.length).toBe(tableParams.formsAfterInput);
                                buttons.forEach(function(btn) {
                                    expect(btn.isDisplayed()).toBe(true);
                                    expect(btn.isEnabled()).toBe(true);
                                });
                            });
                        });

                        it("should click and remove the last record", function() {
                            chaisePage.recordEditPage.getDeleteRowButton(tableParams.formsAfterInput - 1).then(function(button) {
                                return chaisePage.clickButton(button);
                            }).then(function () {
                                return chaisePage.recordEditPage.getAllDeleteRowButtons();
                            }).then(function(buttons) {
                                expect(buttons.length).toBe(tableParams.formsAfterInput - 1);
                            });
                        });
                    } else {
                        it("zero delete buttons should be visible", function() {
                            chaisePage.recordEditPage.getAllDeleteRowButtons().then(function(buttons) {
                                expect(buttons.length).toBe(1);
                                buttons.forEach(function(btn) {
                                    expect(btn.isDisplayed()).toBe(false);
                                });
                            });
                        });
                    }
                });

                describe("Submit " + tableParams.inputs.length + " records", function() {
                    recordEditHelpers.testSubmission(tableParams);
                });

                if (!process.env.CI && tableParams.files.length > 0) {
                    afterAll(function() {
                        recordEditHelpers.deleteFiles(tableParams.files);
                        console.log("\n");
                    });
                }
            });
        })(testParams.tables[i], i);
    }

    describe('When url has a prefill query string param set, ', function() {
        var testCookie = {};
        beforeAll(function() {
            browser.ignoreSynchronization=true;
            // Refresh the page
            browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/product-add:accommodation");
            chaisePage.waitForElement(element(by.id("submit-record-button"))).then (function () {
                // Write a dummy cookie for creating a record in Accommodation table
                testCookie = {
                    fkColumnNames: ['npH9l-Il-ZAadyQ8VTPStA'], // A FK that Accommodation table has with Category table, column._name
                    rowname: {
                        value: "Castle"
                    },
                    keys: {id: 10007},
                    origUrl: process.env.ERMREST_URL + "/catalog/" + browser.params.catalogId + "/entity/product-add:category/id=10007"
                };
                // NOTE: if origUrl is improper, the rowname value above is set in the input field
                // origUrl is used to fetch the entity after the fact to get other data that may be used by domain-filter-pattern
                // the input field value is updated when this entity returns
                // NOTE: this test was updated to fix the constraint name, and include a proper url, key, and rowname
                browser.manage().addCookie({name: 'test', value: JSON.stringify(testCookie)});
            });

        });

        it('should pre-fill fields from the prefill cookie', function() {
            // Reload the page with prefill query param in url
            browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/product-add:accommodation?prefill=test");

            chaisePage.waitForElement(element(by.id("submit-record-button"))).then(function() {
                return browser.manage().getCookie('test');
            }).then(function(cookie) {
                if (cookie) {
                    var field = chaisePage.recordEditPage.getInputById(0, "Category");
                    expect(field.getAttribute("value")).toBe(testCookie.rowname.value);
                } else {
                    // Fail the test
                    expect('Cookie did not load').toEqual('but cookie should have loaded');
                }
            });
        });

        afterAll(function() {
            browser.manage().deleteCookie('test');
        });
    });

    describe('Markdown Editor Help button is clicked, ', function() {
        beforeAll(function() {
            browser.ignoreSynchronization = true;
            browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/product-add:accommodation");
            helpBtn = element.all(by.css('button[title=Help]')).get(0);
            chaisePage.waitForElement(helpBtn);
        });

        it("should open a new window with the help page.",function(done){
            helpBtn.click().then(function () {
                return browser.getAllWindowHandles();
            }).then(function(handles) {
                allWindows = handles;
                return browser.switchTo().window(allWindows[1]);
            }).then(function() {
                return chaisePage.waitForElement(element(by.id("mainTable")));
            }).then(function() {
                // this is a static page, we just want to make sure this is the correct page.
                // we don't need to test every element.
                expect(element(by.id('mainTable')).all(by.tagName('tr')).count()).toBe(22,'Table row count could not be matched.');
                expect(element(by.id('rBold1')).getText()).toBe("**Something Bold**",'first row, first column missmatch');
                expect(element(by.id('rBold2')).getText()).toBe("__Something Bold__",'first row, second column missmatch');
                expect(element(by.id('oBold')).getAttribute('innerHTML')).toBe("<strong>Something Bold</strong>",'first row, third column missmatch');
                done();
            }).then(function() {
                // - Go back to initial Record page
                browser.close();
                browser.switchTo().window(allWindows[0]);
            }).catch(function(error) {
                done.fail(error);
            });
        });
    });
});
