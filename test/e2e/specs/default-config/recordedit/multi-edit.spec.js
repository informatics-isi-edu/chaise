var chaisePage = require('../../../utils/chaise.page.js');
var recordEditHelpers = require('../../../utils/recordedit-helpers.js');

var testParams = {
    schema_name: "multi-edit",
    tables: [{
            table_name: "multi-add-table",
            keys: [
                {name: "id", value: "1000", operator: "="},
                {name: "id", value: "1001", operator: "="}
            ],
            rows: [{
                    "int": {"value": "7", "input": "4"},
                    "text": {"value": "test text", "input": "modified val"}
                }, {
                    "int": {"value": "12", "input": "66"},
                    "text": {"value": "description", "input": "description 2"}
                }
            ],
            results: [
                ["1000", "modified val", "4"],
                ["1001", "description 2", "66"]
            ]
        }, {
            table_name: "multi-add-table",
            keys: [
                {name: "id", value: "1000", operator: "="},
                {name: "id", value: "1001", operator: "="},
                {name: "id", value: "1002", operator: "="}
            ],
            rows: [{
                    "int": {"value": "4", "input": "5"},
                    "text": {"value": "modified val", "input": "changed it again"}
                }, {
                    "int": {"value": "66", "input": "768"},
                    "text": {"value": "description 2", "input": "description 3"}
                },
                {
                    "int": {"value": "34", "input": "934"},
                    "text": {"value": "just text", "input": "I am number 3"}
                }
            ],
            results: [
                ["1000", "changed it again", "5"],
                ["1001", "description 3", "768"],
                ["1002", "I am number 3", "934"]
            ]
        }, {
            table_name: 'table_w_multiple_assets',
            keys: [
                {name: "id",value: "1", operator: "="},
                {name: "id",value: "2",operator: "="}
            ],
            rows: [{
                    "file_1": {"isFile": true, "value": "/hatrac/js/chaise/prev/111111", "input": 0},
                    "file_2": {"isFile": true, "value": "/hatrac/js/chaise/prev/222222", "input": 1},
                    "file_3": {"isFile": true, "value": "/hatrac/js/chaise/prev/333333", "input": 2},
                },
                {
                    "file_1": {"isFile": true, "value": "/hatrac/js/chaise/prev/111111", "input": 0},
                    "file_2": {"isFile": true, "value": "/hatrac/js/chaise/prev/222222", "input": 1},
                    "file_3": {"isFile": true, "value": "/hatrac/js/chaise/prev/333333", "input": 2},
                }
            ],
            results: [
                [
                    {"link": "/hatrac/js/chaise/value/","value": "testfile500kb_1.png"}, "testfile500kb_1.png", "512,000",
                    {"link": "/hatrac/js/chaise/generated/","value": "testfile500kb_2.png"}, "testfile500kb_2.png", "512,000",
                    {"link": "/hatrac/js/chaise/generated_inv/","value": "testfile500kb_3.png"}, "testfile500kb_3.png", "512,000"
                ],
                [
                    {"link": "/hatrac/js/chaise/value/","value": "testfile500kb_1.png"}, "testfile500kb_1.png", "512,000",
                    {"link": "/hatrac/js/chaise/generated/","value": "testfile500kb_2.png"}, "testfile500kb_2.png", "512,000",
                    {"link": "/hatrac/js/chaise/generated_inv/","value": "testfile500kb_3.png"}, "testfile500kb_3.png", "512,000"
                ]
            ],
            files: [{
                    name: "testfile500kb_1.png",
                    size: "512000",
                    displaySize: "500KB",
                    path: "testfile500kb_1.png"
                },
                {
                    name: "testfile500kb_2.png",
                    size: "512000",
                    displaySize: "500KB",
                    path: "testfile500kb_2.png"
                },
                {
                    name: "testfile500kb_3.png",
                    size: "512000",
                    displaySize: "500KB",
                    path: "testfile500kb_3.png"
                }
            ]
        }
    ]

};

var i, j, k;

describe('Edit multiple existing record,', function() {

    for (i = 0; i < testParams.tables.length; i++) {
        (function(tableParams, tableIndex, schemaName) {
            var hasFile = tableParams.files && tableParams.files.length > 0;
            var hasErrors = false;

            // don't run upload test cases on travis
            if (process.env.TRAVIS && hasFile) {
                return;
            }

            // create files
            if (hasFile) {
                beforeAll(function() {
                    recordEditHelpers.createFiles(tableParams.files);
                });
            }

            describe("when the user edits " + tableParams.keys.length + " records at a time " + (hasFile ? "with files" : "") + ", ", function() {

                beforeAll(function() {
                    var keys = [];
                    tableParams.keys.forEach(function(key) {
                        keys.push(key.name + key.operator + key.value);
                    });
                    browser.ignoreSynchronization = true;
                    browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/" + schemaName + ":" + tableParams.table_name + "/" + keys.join(";"));
                });

                it("should have the table displayname as part of the entity title.", function() {
                    // if submit button is visible, this means the recordedit page has loaded
                    chaisePage.waitForElement(element(by.id("submit-record-button"))).then(function() {
                        expect(chaisePage.recordEditPage.getEntityTitleElement().getText()).toBe("Edit " + tableParams.table_name + " Records");
                    });
                });

                it("columns should have correct value, and selectable.", function() {
                    chaisePage.waitForElement(element(by.id("submit-record-button"))).then(function() {
                        for (j = 0; j < tableParams.rows.length; j++) {
                            var row = tableParams.rows[j];
                            for (var key in row) {
                                if (row[key].isFile) {
                                    recordEditHelpers.testFileInput(key, j, tableParams.files[row[key].input])
                                } else {
                                    var input = chaisePage.recordEditPage.getInputById(j, key);
                                    // test current value
                                    expect(input.getAttribute("value")).toBe(row[key].value, "row=" + j + ", column=" + key + " didn't have the expected value.");

                                    // change the value
                                    chaisePage.recordEditPage.clearInput(input);
                                    browser.sleep(10);
                                    input.sendKeys(row[key].input);

                                    // test that value has changed
                                    expect(input.getAttribute("value")).toBe(row[key].input, "row=" + j + ", column=" + key + " didn't get the new value.");
                                }
                            }
                        }
                    });

                });

                describe("Submit " + tableParams.keys.length + " records", function() {
                    beforeAll(function(done) {
                        // submit form
                        chaisePage.recordEditPage.submitForm();


                        if (hasFile) {
                            browser.wait(ExpectedConditions.invisibilityOf($('.upload-table')), tableParams.files.length ? (tableParams.keys.length * tableParams.files.length * browser.params.defaultTimeout) : browser.params.defaultTimeout);
                        }

                        // Make sure the table shows up with the expected # of rows
                        browser.wait(function() {
                            return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                                return (ct == tableParams.keys.length);
                            });
                        }, browser.params.defaultTimeout);

                        done();
                    });

                    it("should change the view to the resultset table and verify the count.", function(done) {
                        browser.driver.getCurrentUrl().then(function(url) {
                            expect(url.startsWith(process.env.CHAISE_BASE_URL + "/recordedit/")).toBe(true);
                            done();
                        });
                    });

                    it("should have the correct title with correct uri", function() {

                    });

                    it('should show correct table rows.', function() {
                        chaisePage.recordsetPage.getRows().then(function(rows) {
                            // same row count
                            expect(rows.length).toBe(tableParams.results.length, "number of rows are not as expected.");

                            for (j = 0; j < rows.length; j++) {
                                (function(index) {
                                    rows[index].all(by.tagName("td")).then(function(cells) {

                                        // same column count
                                        expect(cells.length).toBe(tableParams.results[index].length, "number of columns are not as expected.");

                                        var result;

                                        // cells is what is being shown
                                        // tableParams.results is what we expect
                                        for (k = 0; k < tableParams.results[index].length; k++) {
                                            result = tableParams.results[index][k];

                                            if (typeof result.link === 'string') {
                                                expect(cells[k].element(by.tagName("a")).getAttribute("href")).toContain(result.link);
                                                expect(cells[k].element(by.tagName("a")).getText()).toBe(result.value, "data missmatch in row with index=" + index + ", columns with index=" + k);
                                            } else {
                                                expect(cells[k].getText()).toBe(result, "data missmatch in row with index=" + index + ", columns with index=" + k);
                                            }
                                        }
                                    });

                                })(j);
                            };

                        });
                    });
                });
            });

            // delete files
            if (tableParams.files && tableParams.files.length > 0) {
                afterAll(function(done) {
                    recordEditHelpers.deleteFiles(tableParams.files);
                    done();
                });
            }

        })(testParams.tables[i], i, testParams.schema_name);
    }
});
