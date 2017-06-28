var chaisePage = require('../../../utils/chaise.page.js');
var recordEditHelpers = require('../../../utils/recordedit-helpers.js');
var mustache = require('../../../../../../ermrestjs/vendor/mustache.min.js');
var testParams = {
    tables: [{
        table_name: "accommodation",
        key: { name: "id", value: "2002", operator: "="},
        primary_keys: ["id"],
        columns: [
            { name: "id", generated: true, immutable: true, title: "Id", value: "2002", type: "serial4", nullok: false},
            { name: "title", title: "<strong>Name of Accommodation</strong>", value: "Sherathon Hotel", type: "text", nullok: false},
            { name: "website", isUrl: true, title: "Website", value: "<p class=\"ng-scope\"><a href=\"http://www.starwoodhotels.com/sheraton/index.html\">Link to Website</a></p>", type: "text", comment: "A valid url of the accommodation"},
            { name: "category",isForeignKey: true, title: "Category", value: "Hotel", type: "text", comment: "Type of accommodation ('Resort/Hotel/Motel')", presentation: { type: "url", template: "{{{chaise_url}}}/record/#{{catalog_id}}/product-edit:category/id=10003"}, nullok: false},
            { name: "rating", title: "User Rating", value: "4.3000", type: "float4", nullok: false},
            { name: "summary", title: "Summary", nullok: false, value: "Sherathon Hotels is an international hotel company with more than 990 locations in 73 countries. The first Radisson Hotel was built in 1909 in Minneapolis, Minnesota, US. It is named after the 17th-century French explorer Pierre-Esprit Radisson.", type: "longtext"},
            { name: "description", title: "Description", type: "markdown", value: "<p class=\"ng-scope\"><strong>CARING. SHARING. DARING.</strong><br>\nRadisson<sup>®</sup> is synonymous with outstanding levels of service and comfort delivered with utmost style. And today, we deliver even more to make sure we maintain our position at the forefront of the hospitality industry now and in the future.<br>\nOur hotels are service driven, responsible, socially and locally connected and demonstrate a modern friendly attitude in everything we do. Our aim is to deliver our outstanding <code>Yes I Can!</code> <sup>SM</sup> service, comfort and style where you need us.</p>\n<p class=\"ng-scope\"><strong>THE RADISSON<sup>®</sup> WAY</strong> Always positive, always smiling and always professional, Radisson people set Radisson apart. Every member of the team has a dedication to <code>Yes I Can!</code> <sup>SM</sup> hospitality – a passion for ensuring the total wellbeing and satisfaction of each individual guest. Imaginative, understanding and truly empathetic to the needs of the modern traveler, they are people on a special mission to deliver exceptional Extra Thoughtful Care.</p>"},
            { name: "no_of_rooms", title: "Number of Rooms", value: "23", type: "int2"},
            { name: "cover", isForeignKey: true, title: "Cover Image", value: "3,005" , type: "int2", presentation: { type:"url", template: "{{{chaise_url}}}/record/#{{catalog_id}}/product-edit:file/id=3005"} },
            { name: "thumbnail", isForeignKey: true, title: "Thumbnail", value: null, type: "int4"},
            { name: "opened_on", title: "Operational Since", value: "12/9/2008, 12:00:00 AM", type: "timestamptz", nullok: false },
            { name: "luxurious", title: "Is Luxurious", value: "false", type: "boolean" },
            { name: "json_col", title: "json_col", value:JSON.stringify({"name": "testing"},undefined,2) , type: "json" },
            { name: "jsonb_col", title: "jsonb_col", value: JSON.stringify({"name": "testing_jsonb"},undefined,2), type: "jsonb" }
        ],
        delete_keys: [{ name: "id", value: "4004", operator: "="}],
        edit_entity_displayname: "Sherathon Hotel",
        files: []
    }, {
        table_name: "file",
        key: { name: "id", value: "90007", operator: "="},
        primary_keys: ["id"],
        columns: [
            { name: "fileid", title: "fileid", type: "int4" },
            { name: "uri", title: "uri", type: "text", "isFile": true, comment: "asset/reference" },
            { name: "content_type", title: "content_type", type: "text"},
            { name: "timestamp", title: "timestamp", type: "timestamptz"},
            { name: "image_width", title: "image_width", type: "int8"},
            { name: "image_height", title: "image_height", type: "int8"}
        ],
        edit_entity_displayname: "90007",
        delete_keys: [],
        files: [{
            name: "testfile500kb.png",
            size: "512000",
            displaySize: "500KB",
            path: "testfile500kb.png"
        }]
    }]
};

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
                                browser.wait(ExpectedConditions.invisibilityOf($('.upload-table')), tableParams.files.length ? (tableParams.records * tableParams.files.length * browser.params.defaultTimeout) : browser.params.defaultTimeout);
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
