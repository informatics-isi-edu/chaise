var chaisePage = require('../../../utils/chaise.page.js');
var recordEditHelpers = require('../../../utils/recordedit-helpers.js');
var mustache = require('../../../../../../ermrestjs/vendor/mustache.min.js');
var moment = require('moment');

var testParams = {
    tables: [{
        table_name: "accommodation",
        table_displayname: "Sherathon Hotel",
        key: { name: "id", value: "2008", operator: "="},
        primary_keys: ["id"],
        columns: [
            { name: "id", generated: true, immutable: true, title: "Id", type: "serial4", nullok: false},
            { name: "title", title: "<strong>Name of Accommodation</strong>", type: "text", nullok: false},
            { name: "website", title: "Website", type: "text", comment: "A valid url of the accommodation"},
            { name: "category",  title: "Category", type: "text", isForeignKey: true, count: 5, table_title: "Categories", comment: "Type of accommodation ('Resort/Hotel/Motel')", presentation: { type: "url", template: "{{{chaise_url}}}/record/#{{catalog_id}}/product-edit:category/id=10003"}, nullok: false},
            { name: "rating", title: "User Rating", type: "float4", nullok: false},
            { name: "summary", title: "Summary", nullok: false, type: "longtext"},
            { name: "description", title: "Description", type: "markdown"},
            { name: "no_of_rooms", title: "Number of Rooms", type: "int2"},
            { name: "opened_on", title: "Operational Since", type: "timestamptz", nullok: false },
            { name: "date_col", title: "date_col", type: "date"},
            { name: "luxurious", title: "Is Luxurious", type: "boolean" }
        ],
        values: [
            {"id": "2008", "title": "Sherathon Hotel", "website": "http://www.starwoodhotels.com/sheraton/index.html", "category": "Hotel", "rating": "4.3",
             "summary": "Sherathon Hotels is an international hotel company with more than 990 locations in 73 countries. The first Radisson Hotel was built in 1909 in Minneapolis, Minnesota, US. It is named after the 17th-century French explorer Pierre-Esprit Radisson.",
             "description": "**CARING. SHARING. DARING.**", "no_of_rooms": "23", "opened_on": moment("12/9/2008, 12:00:00 AM", "MM/DD/YYYY, HH:mm:ss A"),
             "date_col": "2008-12-09", "luxurious": "true"
            }
        ],
        inputs: [
            {"title": "new title 1", "website": "https://example1.com", "category": {index: 0, value: "Hotel"}, 
             "rating": "1", "summary": "This is the summary of this column 1.", "description": "## Description 1", 
             "no_of_rooms": "1", "opened_on": moment("2017-01-01 01:01:00", "YYY-MM-DD hh:mm:ss"), "date_col": "2017-01-01", "luxurious": false},
        ],
        results: [
            
        ],
        files: []
    }]
};

// {
//     table_name: "file",
//     key: { name: "id", value: "90007", operator: "="},
//     primary_keys: ["id"],
//     columns: [
//         { name: "fileid", title: "fileid", type: "int4" },
//         { name: "uri", title: "uri", type: "text", "isFile": true, comment: "asset/reference" },
//         { name: "content_type", title: "content_type", type: "text"},
//         { name: "timestamp", title: "timestamp", type: "timestamptz"},
//         { name: "image_width", title: "image_width", type: "int8"},
//         { name: "image_height", title: "image_height", type: "int8"}
//     ],
//     table_displayname: "90007",
//     delete_keys: [],
//     files: [{
//         name: "testfile500kb.png",
//         size: "512000",
//         displaySize: "500KB",
//         path: "testfile500kb.png"
//     }]
// }

describe('Edit existing record,', function() {

    for (var i=0; i< testParams.tables.length; i++) {

        (function(tableParams, index) {
            
            if (!process.env.TRAVIS && tableParams.files.length > 0) {
                beforeAll(function() {
                    // create files that will be uploaded
                    recordEditHelpers.createFiles(tableParams.files);
                });
            }

            describe("For table " + tableParams.table_name + ",", function() {

                var record;

                beforeAll(function () {
                
                    var keys = [];
                    keys.push(tableParams.key.name + tableParams.key.operator + tableParams.key.value);
                    browser.ignoreSynchronization=true;
                    browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/product-edit:" + tableParams.table_name + "/" + keys.join("&"));
                    
                

                    chaisePage.waitForElement(element(by.id("submit-record-button"))).then(function() {
                        return chaisePage.recordEditPage.getViewModelRows();
                    }).then(function(records) {
                        browser.params.record = record = records[0];
                        tableParams.columns.forEach(function(c) {
                            if (record[c.name]) {
                                if (c.type !== "date" && c.type !== "timestamptz") {
                                    c._value =  record[c.name] + "";
                                }
                            }
                        });
                    });
                });


                describe("Presentation and validation,", function() {
                    var params = recordEditHelpers.testPresentationAndBasicValidation(tableParams, true);
                });

                describe("Submitting an existing record,", function() {
                    var keys = [], hasErrors = false;

                    beforeAll(function() {
                        // Build the keys component of a url for checking whether record app is on the right url
                        keys.push(tableParams.key.name + tableParams.key.operator + tableParams.key.value);

                        // Submit the form
                        chaisePage.recordEditPage.submitForm();
                    });

                    it("should have no errors", function() {
                        chaisePage.recordEditPage.getAlertError().then(function(err) {
                            if (err) {
                                expect("Page has errors").toBe("No errors");
                                hasErrors = true;
                            } else {
                                expect(true).toBe(true);
                            }
                        });
                    });

                    it("should redirect to Record page", function() {
                        if (!hasErrors) {

                            // if there is a file upload
                            if (!process.env.TRAVIS && tableParams.files.length > 0) {
                                browser.wait(ExpectedConditions.invisibilityOf($('.upload-table')), tableParams.files.length ? (tableParams.inputs.length * tableParams.files.length * browser.params.defaultTimeout) : browser.params.defaultTimeout);
                            }

                            var redirectUrl = browser.params.url+ "/record/#" + browser.params.catalogId + "/product-edit:" + tableParams.table_name + '/' + keys.join('&');
                            // Wait for #tblRecord on Record page to appear
                            chaisePage.waitForElement(element(by.id('tblRecord'))).then(function() {
                                expect(browser.driver.getCurrentUrl()).toBe(redirectUrl);
                            }, function() {
                                expect('Expected Record page to load an entity table').toBe('but the wait timed out.');
                            });
                        }
                    });
                });
                
                if (!process.env.TRAVIS && tableParams.files.length > 0) {
                    afterAll(function(done) {
                        recordEditHelpers.deleteFiles(tableParams.files);
                        done();
                    });
                }

            });

        })(testParams.tables[i], i);
    }
});
