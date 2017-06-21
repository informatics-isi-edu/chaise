var chaisePage = require('../../../utils/chaise.page.js');
var recordEditHelpers = require('../../../utils/recordedit-helpers.js'), chance = require('chance').Chance();
var exec = require('child_process').execSync;
var moment = require('moment');

// take a look at the comments in recordedit-helpers.js for the expected structure of tableParams.
var testParams = {
    tables: [{
        table_name: "accommodation",
        table_displayname: "Accommodations",
        primary_keys: ["id"],
        columns: [
            { name: "id", generated: true, immutable: true, title: "Id", type: "serial4", nullok: false},
            { name: "title", title: "Name of Accommodation", type: "text", nullok: false},
            { name: "website", title: "Website", type: "text", comment: "A valid url of the accommodation"},
            { name: "category", title: "Category", type: "text", nullok: false, isForeignKey: true,  count: 5, table_title: "Categories", comment: "Type of accommodation ('Resort/Hotel/Motel')"},
            { name: "rating", title: "User Rating", type: "float4", nullok: false},
            { name: "summary", title: "Summary", type: "longtext", nullok: false},
            { name: "description", title: "Description", type: "markdown"},
            { name: "no_of_rooms", title: "Number of Rooms", type: "int2"},
            { name: "opened_on", title: "Operational Since", type: "timestamptz", nullok: false },
            { name: "date_col", title: "date_col", type: "date"},
            { name: "luxurious", title: "Is Luxurious", type: "boolean" }
        ],
        inputs: [
            {"title": "new title 1", "website": "https://example1.com", "category": {index: 0, value: "Hotel"}, 
             "rating": "1", "summary": "This is the summary of this column 1.", "description": "## Description 1", 
             "no_of_rooms": "1", "opened_on": moment("2017-01-01 01:01:00", "YYY-MM-DD hh:mm:ss"), "date_col": "2017-01-01", "luxurious": false},
            {"title": "new title 2", "website": "https://example2.com", "category": {index: 1, value: "Ranch"}, 
             "rating": "2",  "summary": "This is the summary of this column 2.", "description": "## Description", 
             "no_of_rooms": "2", "opened_on": moment("2017-02-02 02:02:00", "YYY-MM-DD hh:mm:ss"), "date_col": "2017-02-02", "luxurious":  true}
        ],
        results: [
            ["new title 1",  "https://example1.com", undefined, "1.0000", "This is the summary of this column 1.", "## Description 1", "1", undefined, false],
            ["new title 2",  "https://example2.com", undefined, "2.0000", "This is the summary of this column 2.", "## Description 2", "2", undefined, true]
        ],
        files: []
    }]
};

// {
//    table_name: "file",
//    table_displayname: "file",
//    primary_keys: ["id"],
//    columns: [
//        { name: "fileid", title: "fileid", type: "int4" },
//        { name: "uri", title: "uri", type: "text", isFile: true, comment: "asset/reference" },
//        { name: "content_type", title: "content_type", type: "text"},
//        { name: "timestamp", title: "timestamp", type: "timestamptz"},
//        { name: "image_width", title: "image_width", type: "int8"},
//        { name: "image_height", title: "image_height", type: "int8"}
//    ],
//    inputs: 2,
//    files : [{
//        name: "testfile1MB.txt",
//        size: "1024000",
//        displaySize: "1MB",
//        path: "testfile1MB.txt"
//    }, {
//        name: "testfile500kb.png",
//        size: "512000",
//        displaySize: "500KB",
//        path: "testfile500kb.png"
//    }, {
//        name: "testfile5MB.pdf",
//        size: "5242880",
//        displaySize: "5MB",
//        path: "testfile5MB.pdf"
//    }]
// }
describe('Record Add', function() {

    for (var i=0; i< testParams.tables.length; i++) {

        (function(tableParams, index) {

            describe("======================================================================= \n    "
            + tableParams.inputs.length + " record(s) for table " + tableParams.table_name + ",", function() {

                beforeAll(function () {
                    browser.ignoreSynchronization=true;
                    browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/product-add:" + tableParams.table_name);
                    chaisePage.waitForElement(element(by.id("submit-record-button")));
                });

                describe("Presentation and validation,", function() {

                    if (!process.env.TRAVIS && tableParams.files.length > 0) {
                        beforeAll(function() {
                            // create files that will be uploaded
                            recordEditHelpers.createFiles(tableParams.files);
                        });
                    }

                    var params = recordEditHelpers.testPresentationAndBasicValidation(tableParams, false);
                });

                describe("remove record, ", function() {

                    if (tableParams.inputs.length > 1) {
                        
                        it("should click and add an extra record.", function() {
                            chaisePage.recordEditPage.getAddRowButton().then(function(button) {
                                chaisePage.clickButton(button);
                            });
                        });

                        it((tableParams.inputs.length+1) + " buttons should be visible and enabled", function() {
                            chaisePage.recordEditPage.getAllDeleteRowButtons().then(function(buttons) {
                                expect(buttons.length).toBe(tableParams.inputs.length + 1);
                                buttons.forEach(function(btn) {
                                    expect(btn.isDisplayed()).toBe(true);
                                    expect(btn.isEnabled()).toBe(true);
                                });
                            });
                        });

                        it("should click and remove the last record", function() {
                            chaisePage.recordEditPage.getDeleteRowButton(tableParams.inputs.length).then(function(button)	 {
                                chaisePage.clickButton(button);

                                browser.wait(protractor.ExpectedConditions.visibilityOf(element(by.id('delete-confirmation'))), browser.params.defaultTimeout);

                                chaisePage.recordEditPage.getDeleteModalButton().then(function(modalBtn) {
                                    chaisePage.clickButton(modalBtn);
                                    browser.sleep(50);
                                    chaisePage.recordEditPage.getAllDeleteRowButtons().then(function(buttons) {
                                        expect(buttons.length).toBe(tableParams.inputs.length);
                                    });
                                });
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
                    beforeAll(function() {
                        // Submit the form
                        chaisePage.recordEditPage.submitForm();
                    });

                    var hasErrors = false;

                    it("should have no errors, and should be redirected", function() {
                        chaisePage.recordEditPage.getAlertError().then(function(err) {
                            if (err) {
                                expect("Page has errors").toBe("No errors");
                                hasErrors = true;
                            } else {
                                expect(true).toBe(true);
                            }
                        });
                    });

                    it("should be redirected to record page", function() {
                        if (!hasErrors) {
                            // doesn't redirect to record
                            if (tableParams.inputs.length > 1) {

                                // if there is a file upload
                                if (!process.env.TRAVIS && tableParams.files.length > 0) {
                                    browser.wait(ExpectedConditions.invisibilityOf($('.upload-table')), tableParams.files.length ? (tableParams.inputs.length * tableParams.files.length * browser.params.defaultTimeout) : browser.params.defaultTimeout);
                                }

                                // wait for url change
                                browser.wait(function () {
                                    return browser.driver.getCurrentUrl().then(function(url) {
                                        return url.startsWith(process.env.CHAISE_BASE_URL + "/recordedit/");
                                    });
                                }, browser.params.defaultTimeout);
                                // verify url and ct
                                browser.driver.getCurrentUrl().then(function(url) {
                                    expect(url.startsWith(process.env.CHAISE_BASE_URL + "/recordedit/")).toBe(true, "url has not been changed for table with index=" + index);

                                    browser.wait(function () {
                                        return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                                            return (ct > 0);
                                        });
                                    });

                                    chaisePage.recordsetPage.getRows().count().then(function (ct) {
                                        expect(ct).toBe(tableParams.inputs.length, "number of records is not as expected for table with index=" + index);
                                    });
                                });
                                // redirects to record
                            } else {
                                // wait for url change
                                browser.wait(function () {
                                    return browser.driver.getCurrentUrl().then(function(url) {
                                        return url.startsWith(process.env.CHAISE_BASE_URL + "/record/");
                                    });
                                }, browser.params.defaultTimeout);
                                // cerify url
                                browser.driver.getCurrentUrl().then(function(url) {
                                    expect(url.startsWith(process.env.CHAISE_BASE_URL + "/record/")).toBe(true);
                                });
                            }
                        }
                    });
                    
                    if (!process.env.TRAVIS && tableParams.files.length > 0) {
                        afterAll(function(done) {
                            recordEditHelpers.deleteFiles(tableParams.files);
                            done();
                        });
                    }
                });
            });
        })(testParams.tables[i], i);
    }

    describe('When url has a prefill query string param set, ', function() {
        var testCookie = {};
        beforeAll(function() {
            // Refresh the page
            var url = browser.params.url + "/recordedit/#" + browser.params.catalogId + "/product-add:" + testParams.tables[0].table_name;
            browser.get(url);
            chaisePage.waitForElement(element(by.id("submit-record-button"))).then (function () {
                // Write a dummy cookie for creating a record in Accommodation table
                testCookie = {
                    constraintName: 'product-add_fk_category', // A FK that Accommodation table has with Category table
                    rowname: {
                        value: chance.sentence()
                    },
                    keys: {id: 1}
                };
                browser.manage().addCookie('test', JSON.stringify(testCookie));
            });

        });

        it('should pre-fill fields from the prefill cookie', function() {
            // Reload the page with prefill query param in url
            browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/product-add:" + testParams.tables[0].table_name + '?prefill=test');
            
            chaisePage.waitForElement(element(by.id("submit-record-button"))).then(function() {
                return browser.manage().getCookie('test');
            }).then(function(cookie) {
                if (cookie) {
                    var field = element.all(by.css('.popup-select-value')).first();
                    expect(field.getText()).toBe(testCookie.rowname.value);
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

});
