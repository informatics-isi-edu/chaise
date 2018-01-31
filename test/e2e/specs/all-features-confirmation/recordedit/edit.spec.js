/**
 * This test case is for testing editing a single record
 *
 */
var testConfiguration = browser.params.configuration;
var chaisePage = require('../../../utils/chaise.page.js');
var recordEditHelpers = require('../../../utils/recordedit-helpers.js');
var mustache = require('../../../../../../ermrestjs/vendor/mustache.min.js');
var moment = require('moment');

var currentTimestampTime = moment().format("x");
var testParams = {
    tables: [{
        schema_name: "product-edit",
        table_name: "accommodation",
        table_displayname: "Sherathon Hotel",
        key: { name: "id", value: "2000", operator: "="},
        primary_keys: ["id"],
        columns: [
            { name: "id", generated: true, immutable: true, title: "Id", type: "serial4", nullok: false},
            { name: "title", title: "<strong>Name of Accommodation</strong>", type: "text", nullok: false},
            { name: "website", title: "Website", type: "text", comment: "A valid url of the accommodation"},
            { name: "category",  title: "Category", type: "text", isForeignKey: true, count: 5, totalCount: 5, table_title: "Categories", comment: "Type of accommodation ('Resort/Hotel/Motel')", nullok: false}, // the total count is the total number of rows in the category.json data file
            { name: "rating", title: "User Rating", type: "float4", nullok: false},
            { name: "summary", title: "Summary", nullok: false, type: "longtext"},
            { name: "description", title: "Description", type: "markdown"},
            { name: "no_of_rooms", title: "Number of Rooms", type: "int2"},
            { name: "opened_on", title: "Operational Since", type: "timestamptz", nullok: false },
            { name: "date_col", title: "date_col", type: "date"},
            { name: "luxurious", title: "Is Luxurious", type: "boolean" },
            { name: "json_col", title: "json_col", value:JSON.stringify({"name": "testing"},undefined,2) , type: "json" }
        ],
        values: [
            {"id": "2000", "title": "Sherathon Hotel", "website": "http://www.starwoodhotels.com/sheraton/index.html", "category": "Castle", "rating": "4.3",
             "summary": "Sherathon Hotels is an international hotel company with more than 990 locations in 73 countries. The first Radisson Hotel was built in 1909 in Minneapolis, Minnesota, US. It is named after the 17th-century French explorer Pierre-Esprit Radisson.",
             "description": "**CARING. SHARING. DARING.**", "no_of_rooms": "23", "opened_on": moment("12/9/2008, 12:00:00 AM", "MM/DD/YYYY, HH:mm:ss A"),
             "date_col": "2008-12-09", "luxurious": "true"
            }
        ],
        inputs: [
            {"title": "new title 1", "website": "https://example1.com", "category": {index: 1, value: "Ranch"},
             "rating": "1", "summary": "This is the summary of this column 1.", "description": "## Description 1",
             "no_of_rooms": "1", "opened_on": moment("2017-01-01 01:01:01", "YYYY-MM-DD hh:mm:ss"), "date_col": "2017-01-01", "luxurious": false},
        ],
        result_columns: [
            "title", "website", "product-edit_fk_category", "rating", "summary", "description", "no_of_rooms", "opened_on", "date_col", "luxurious"
        ],
        results: [
            ["new title 1",  {"link":"https://example1.com/", "value":"Link to Website"},
            {"link":"{{{chaise_url}}}/record/#{{catalog_id}}/product-edit:category/id=10004", "value":"Castle"},
            "1.0000", "This is the summary of this column 1.", "Description 1", "1", "2017-01-01 01:01:01", "2017-01-01", "false"]
        ],
        files: []
    }, {
       schema_name: "product-edit",
       table_name: "file",
       table_displayname: "90008",
       primary_keys: ["id"],
       key: { name: "id", value: "90008", operator: "="},
       columns: [
           { name: "fileid", title: "fileid", type: "int4" },
           { name: "uri", title: "uri", type: "text", isFile: true, comment: "asset/reference" },
           { name: "timestamp_txt", title: "timestamp_txt", type: "text"}
       ],
       values: [
           {"fileid":"","uri":"http://images.trvl-media.com/hotels/1000000/30000/28200/28110/28110_191_z.jpg"}
       ],
       inputs: [
           {"fileid": "4", "uri": 0, "timestamp_txt": currentTimestampTime}
       ],
       result_columns: [
           "fileid", "uri", "filename", "bytes"
       ],
       results: [
           ["4", {"link": "/hatrac/js/chaise/"+currentTimestampTime+"/4/", "value": "testfile500kb.png"}, "testfile500kb.png", "512,000"]
       ],
       files : [{
           name: "testfile500kb.png",
           size: "512000",
           displaySize: "500KB",
           path: "testfile500kb.png"
       }]
    }]
};

if (!process.env.TRAVIS) {
    // keep track of namespaces that we use, so we can delete them afterwards
    testConfiguration.hatracNamespaces.push(process.env.ERMREST_URL.replace("/ermrest", "") + "/hatrac/js/chaise/" + currentTimestampTime);
}

describe('Edit existing record,', function() {

    for (var i=0; i< testParams.tables.length; i++) {

        (function(tableParams, index) {

            if (!process.env.TRAVIS && tableParams.files.length > 0) {
                beforeAll(function() {
                    // create files that will be uploaded
                    recordEditHelpers.createFiles(tableParams.files);
                    console.log("\n");
                });
            }

            describe("For table " + tableParams.table_name + ",", function() {

                var record;

                beforeAll(function () {

                    var keys = [];
                    keys.push(tableParams.key.name + tableParams.key.operator + tableParams.key.value);
                    browser.ignoreSynchronization=true;
                    browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/"+ tableParams.schema_name +":" + tableParams.table_name + "/" + keys.join("&"));

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
                    recordEditHelpers.testSubmission(tableParams, true);
                });

                if (!process.env.TRAVIS && tableParams.files.length > 0) {
                    afterAll(function(done) {
                        recordEditHelpers.deleteFiles(tableParams.files);
                        console.log("\n");
                        done();
                    });
                }

            });

        })(testParams.tables[i], i);
    }
});
