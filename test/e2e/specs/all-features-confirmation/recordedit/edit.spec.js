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
        record_displayname: "Sherathon Hotel", //since this is in single-edit, displayname is rowname.
        table_displayname: "Accommodations",
        table_comment: "List of different types of accommodations",
        key: { name: "id", value: "2000", operator: "="},
        not_ci: true,
        primary_keys: ["id"],
        columns: [
            { name: "id", generated: true, immutable: true, title: "Id", type: "serial4", nullok: false},
            { name: "title", title: "<strong>Name of Accommodation</strong>", type: "text", nullok: false},
            { name: "website", title: "Website", type: "text", comment: "A valid url of the accommodation"},
            { name: "category",  title: "Category", type: "text", isForeignKey: true, count: 5, totalCount: 5, comment: "Type of accommodation ('Resort/Hotel/Motel')", nullok: false}, // the total count is the total number of rows in the category.json data file
            { name: "rating", title: "User Rating", type: "float4", nullok: false},
            { name: "summary", title: "Summary", nullok: false, type: "longtext"},
            { name: "description", title: "Description", type: "markdown"},
            { name: "json_col", title: "json_col", value:JSON.stringify({"name": "testing"},undefined,2) , type: "json" },
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
            { name: "color_rgb_hex_column", title: "color_rgb_hex_column", type: "color"}
        ],
        values: [
            {"id": "2000", "title": "Sherathon Hotel", "website": "http://www.starwoodhotels.com/sheraton/index.html", "category": "Castle", "rating": "4.3",
             "summary": "Sherathon Hotels is an international hotel company with more than 990 locations in 73 countries. The first Radisson Hotel was built in 1909 in Minneapolis, Minnesota, US. It is named after the 17th-century French explorer Pierre-Esprit Radisson.",
             "description": "**CARING. SHARING. DARING.**",  "json_col": null, "no_of_rooms": "23", "opened_on": moment("12/9/2008, 12:00:00 AM", "MM/DD/YYYY, HH:mm:ss A"),
             "date_col": "2008-12-09", "luxurious": "true",
             "text_array": "[\n  \"v2\",\n  \"v3\"\n]", "boolean_array": "[\n  false\n]", "int4_array": "[\n  1\n]", "float4_array": "[\n  1.1,\n  2.2\n]",
             "date_array": null, "timestamp_array": "[\n  \"2003-03-03T03:03:03\"\n]",
             "timestamptz_array": "[\n  \""+moment("2002-02-02T02:02:02-08:00", "YYYY-MM-DDTHH:mm:ssZ").format("YYYY-MM-DDTHH:mm:ssZ")+"\"\n]",
             "color_rgb_hex_column": "#623456"
            }
        ],
        inputs: [
            {
                "title": "new title 1", "website": "https://example1.com", "category": {index: 1, value: "Ranch"},
                "rating": "1", "summary": "This is the summary of this column 1.", "description": "## Description 1", "json_col": JSON.stringify({"items": {"qty": 6,"product": "apple"},"customer": "Nitish Sahu"},undefined,2),
                "no_of_rooms": "1", "opened_on": moment("2017-01-01 01:01:01", "YYYY-MM-DD hh:mm:ss"), "date_col": "2017-01-01", "luxurious": false,
                "text_array": "[\"v1\", \"v2\"]", "boolean_array": "[true]", "int4_array": "[1, 2]", "float4_array": "[1, 2.2]",
                "date_array": "[\"2001-01-01\", \"2002-02-02\"]", "timestamp_array": "[null, \"2001-01-01T01:01:01\"]",
                "timestamptz_array": "[null, \"2001-01-01T01:01:01-08:00\"]",
                "color_rgb_hex_column": "#723456"
            }
        ],
        result_columns: [
            "title", "website", "product-edit_fk_category", "rating", "summary", "description",
             "json_col", "no_of_rooms", "opened_on", "date_col", "luxurious",
             "text_array", "boolean_array", "int4_array", "float4_array", "date_array", "timestamp_array", "timestamptz_array",
             "color_rgb_hex_column"
        ],
        results: [
            [
                "new title 1",  {"link":"https://example1.com/", "value":"Link to Website"},
                {"link":"{{{chaise_url}}}/record/#{{catalog_id}}/product-edit:category/id=10004", "value":"Castle"},
                "1.0000", "This is the summary of this column 1.", "Description 1", JSON.stringify({"items": {"qty": 6,"product": "apple"},"customer": "Nitish Sahu"},undefined,2),
                "1", "2017-01-01 01:01:01", "2017-01-01", "false",
                "v1, v2", "true", "1, 2", "1.0000, 2.2000", "2001-01-01, 2002-02-02", "No value, 2001-01-01T01:01:01", "No value, 2001-01-01 01:01:01", "#723456"
            ]
        ],
        files: []
    }, {
       schema_name: "product-edit",
       table_name: "file",
       record_displayname: "90008", //since this is in single-edit, displayname is rowname.
       table_displayname: "file",
       table_comment: "asset/object",
       not_ci: !process.env.CI,
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
           ["4", {"link": "/hatrac/js/chaise/"+currentTimestampTime+"/4/.png/", "value": "testfile500kb.png"}, "testfile500kb.png", "512 kB"]
       ],
       files : [{
           name: "testfile500kb.png",
           size: "512000",
           displaySize: "500 kB",
           path: "testfile500kb.png",
           tooltip: "- testfile500kb.png\n- 500 kB"
       }]
    }]
};

if (!process.env.CI) {
    // keep track of namespaces that we use, so we can delete them afterwards
    testConfiguration.hatracNamespaces.push(process.env.ERMREST_URL.replace("/ermrest", "") + "/hatrac/js/chaise/" + currentTimestampTime);
}

describe('Edit existing record,', function() {

    for (var i=0; i< testParams.tables.length; i++) {

        (function(tableParams) {

            if (!process.env.CI && tableParams.files.length > 0) {
                beforeAll(function() {
                    // create files that will be uploaded
                    recordEditHelpers.createFiles(tableParams.files);
                    console.log("\n");
                });
            }

            describe("For table " + tableParams.table_name + ",", function() {

                beforeAll(function () {

                    var keys = [];
                    keys.push(tableParams.key.name + tableParams.key.operator + tableParams.key.value);
                    chaisePage.navigate(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/"+ tableParams.schema_name +":" + tableParams.table_name + "/" + keys.join("&"));

                    chaisePage.waitForElement(element(by.id("submit-record-button")));
                });


                describe("Presentation and validation,", function() {
                    recordEditHelpers.testPresentationAndBasicValidation(tableParams, true);
                });

                describe("Submitting an existing record,", function() {
                    recordEditHelpers.testSubmission(tableParams, true);
                });

                if (!process.env.CI && tableParams.files.length > 0) {
                    afterAll(function(done) {
                        recordEditHelpers.deleteFiles(tableParams.files);
                        console.log("\n");
                        done();
                    });
                }

            });

        })(testParams.tables[i]);
    }
});
