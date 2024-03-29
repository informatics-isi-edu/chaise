var testConfiguration = browser.params.configuration;
var chaisePage = require('../../../utils/chaise.page.js');
var recordEditHelpers = require('../../../utils/recordedit-helpers.js');
var moment = require('moment');
var EC = protractor.ExpectedConditions

var currentTimestampTime = moment().format("x");
var testParams = {
    schema_name: "multi-edit",
    tables: [
        {
            table_name: "multi-edit-table",
            tableComment: "Table to represent adding multiple entities",
            sortColumns: "id",
            testFkClear: "true",
            fkColumnName: "fk_to_f1",
            keys: [
                {name: "id", value: "1000", operator: "="},
                {name: "id", value: "1001", operator: "="}
            ],
            rows: [{
                    "int": {"value": "7", "input": "4"},
                    "text": {"value": "test text", "input": "modified val"},
                    "json_col":{isTextArea: true, "value":JSON.stringify({"name":"testing json column"},undefined,2),"input" : "{\"name\":\"This is the edited value of json\"}"},
                    "jsonb_col":{isTextArea: true, "value":JSON.stringify({"name":"testing jsonB column"},undefined,2),"input" : "{\"name\":\"This is the edited value of jsonB\"}"},
                }, {
                    "int": {"value": "12", "input": "66"},
                    "text": {"value": "description", "input": "description 2"},
                    "json_col":{isTextArea: true, "value":JSON.stringify({"quantity":"6"},undefined,2),"input" : "{\"quantity\":\"6\"}"},
                    "jsonb_col":{isTextArea: true, "value":JSON.stringify({"quantity":"9"},undefined,2), "input" : "{\"quantity\":\"9\"}"}
                }
            ],
            results: [
                ["1000", "modified val", "4", JSON.stringify({"name":"This is the edited value of json"},undefined,2), JSON.stringify({"name":"This is the edited value of jsonB"},undefined,2), "1"],
                ["1001", "description 2", "66", JSON.stringify({"quantity":"6"},undefined,2), JSON.stringify({"quantity":"9"},undefined,2), "2"]
            ]
        },
        {
            table_name: "multi-edit-table",
            tableComment: "Table to represent adding multiple entities",
            sortColumns: "id",
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
            // apart from the values changed above, the fk values are also empty because the first test case is also doing testFkClear
            results: [
                ["1000", "changed it again", "5", JSON.stringify({"name":"This is the edited value of json"},undefined,2), JSON.stringify({"name":"This is the edited value of jsonB"},undefined,2), ""],
                ["1001", "description 3", "768", JSON.stringify({"quantity":"6"},undefined,2), JSON.stringify({"quantity":"9"},undefined,2), ""],
                ["1002", "I am number 3", "934", JSON.stringify(979.998,undefined,2), JSON.stringify(98.00243,undefined,2), ""]
            ]
        },
        {
            table_name: 'table_w_multiple_assets',
            tableComment: "table that has three file assets",
            sortColumns: "id",
            keys: [
                {name: "id",value: "1", operator: "="},
                {name: "id",value: "2",operator: "="}
            ],
            rows: [{
                    "file_1": {"isFile": true, "value": "/hatrac/js/chaise/prev/111111", "input": 0},
                    "file_2": {"isFile": true, "value": "/hatrac/js/chaise/prev/222222", "input": 1},
                    "file_3": {"isFile": true, "value": "/hatrac/js/chaise/prev/333333", "input": 2},
                    "timestamp_txt": {"input": currentTimestampTime, "value": ""}
                },
                {
                    "file_1": {"isFile": true, "value": "/hatrac/js/chaise/prev/111111", "input": 0},
                    "file_2": {"isFile": true, "value": "/hatrac/js/chaise/prev/222222", "input": 1},
                    "file_3": {"isFile": true, "value": "/hatrac/js/chaise/prev/333333", "input": 2},
                    "timestamp_txt": {"input": currentTimestampTime, "value": ""}
                }
            ],
            results: [
                [
                    {"link": "/hatrac/js/chaise/"+currentTimestampTime+"/value/","value": "testfile500kb_1.png"}, "testfile500kb_1.png", "512 kB",
                    {"link": "/hatrac/js/chaise/"+currentTimestampTime+"/generated/","value": "testfile500kb_2.png"}, "testfile500kb_2.png", "512 kB",
                    {"link": "/hatrac/js/chaise/"+currentTimestampTime+"/generated_inv/","value": "testfile500kb_3.png"}, "testfile500kb_3.png", "512 kB"
                ],
                [
                    {"link": "/hatrac/js/chaise/"+currentTimestampTime+"/value/","value": "testfile500kb_1.png"}, "testfile500kb_1.png", "512 kB",
                    {"link": "/hatrac/js/chaise/"+currentTimestampTime+"/generated/","value": "testfile500kb_2.png"}, "testfile500kb_2.png", "512 kB",
                    {"link": "/hatrac/js/chaise/"+currentTimestampTime+"/generated_inv/","value": "testfile500kb_3.png"}, "testfile500kb_3.png", "512 kB"
                ]
            ],
            files: [{
                    name: "testfile500kb_1.png",
                    size: "512000",
                    displaySize: "500KB",
                    path: "testfile500kb_1.png",
                    tooltip: "- testfile500kb_1.png\n- 500 kB"
                },
                {
                    name: "testfile500kb_2.png",
                    size: "512000",
                    displaySize: "500KB",
                    path: "testfile500kb_2.png",
                    tooltip: "- testfile500kb_2.png\n- 500 kB"
                },
                {
                    name: "testfile500kb_3.png",
                    size: "512000",
                    displaySize: "500KB",
                    path: "testfile500kb_3.png",
                    tooltip: "- testfile500kb_3.png\n- 500 kB"
                }
            ]
        }
    ]

};

if (!process.env.CI) {
    // keep track of namespaces that we use, so we can delete them afterwards
    testConfiguration.hatracNamespaces.push(process.env.ERMREST_URL.replace("/ermrest", "") + "/hatrac/js/chaise/" + currentTimestampTime);
}

var i, j, k;

describe('Edit multiple existing record,', function() {

    for (i = 0; i < testParams.tables.length; i++) {
        (function(tableParams, tableIndex, schemaName) {
            var hasFile = tableParams.files && tableParams.files.length > 0;
            var hasErrors = false;
            var keyPairs = [];
            tableParams.keys.forEach(function(key) {
                keyPairs.push(key.name + key.operator + key.value);
            });

            // don't run upload test cases on ci
            if (process.env.CI && hasFile) {
                return;
            }

            // create files
            if (hasFile) {
                beforeAll(function() {
                    recordEditHelpers.createFiles(tableParams.files);
                });
            }

            describe("when the user edits " + tableParams.keys.length + " records at a time" + (hasFile ? " with files" : "") + ", ", function() {

                beforeAll(function() {
                    chaisePage.navigate(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/" + schemaName + ":" + tableParams.table_name + "/" + keyPairs.join(";") + "@sort(" + tableParams.sortColumns + ")");
                });

                it("should have the title displayed properly.", function() {
                    let entityTitleText = 'Edit ' + tableParams.keys.length + ' ' + tableParams.table_name + ' records';
                    // if submit button is visible, this means the recordedit page has loaded
                    chaisePage.waitForElement(element(by.id("submit-record-button"))).then(function() {
                        expect(chaisePage.recordEditPage.getEntityTitleElement().getText()).toBe(entityTitleText, "Multi-edit title is incorrect.");
                    });
                });

                it ("should have the correct head title using the heuristics for recordedit app in entry/edit mode with multiple records", function (done) {
                    let headTitleText = "Edit " + tableParams.table_name;
                    browser.executeScript("return chaiseConfig;").then(function(chaiseConfig) {
                        // Edit <table-name>: <row-name> | Chaise
                        // no chaiseConfig.headTitle so use default value of Chaise
                        expect(browser.getTitle()).toBe(headTitleText + " | Chaise");

                        done();
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });

                it("should have the table displayname as part of the entity title with the proper tooltip.", function() {
                    // if submit button is visible, this means the recordedit page has loaded
                    var titleLink = chaisePage.recordEditPage.getEntityTitleLinkElement();
                    expect(titleLink.getText()).toBe(tableParams.table_name, "table name link is incorrect.");

                    chaisePage.testTooltipReturnPromise(titleLink, tableParams.tableComment, 'recordedit');
                });

                it("columns should have correct value, and selectable.", function() {
                    chaisePage.waitForElement(element(by.id("submit-record-button"))).then(function() {
                        for (j = 0; j < tableParams.rows.length; j++) {
                            var row = tableParams.rows[j];
                            for (var key in row) {
                                let colParams = row[key];
                                if (colParams.isFile) {
                                    recordEditHelpers.testFileInput(key, j, tableParams.files[colParams.input])
                                } else {
                                    let input = chaisePage.recordEditPage.getInputForAColumn(key, j + 1);
                                    if (colParams.isTextArea) input = chaisePage.recordEditPage.getTextAreaForAColumn(key, j+1);
                                    // test current value
                                    expect(input.getAttribute("value")).toBe(colParams.value, "row=" + j + ", column=" + key + " didn't have the expected value.");

                                    // change the value
                                    chaisePage.recordEditPage.clearInput(input);
                                    browser.sleep(10);
                                    input.sendKeys(colParams.input);

                                    // test that value has changed
                                    expect(input.getAttribute("value")).toBe(colParams.input, "row=" + j + ", column=" + key + " didn't get the new value.");
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
                            browser.wait(
                              EC.invisibilityOf(element(by.css('.upload-table'))),
                              tableParams.files.length ? (tableParams.keys.length * tableParams.files.length * browser.params.defaultTimeout) : browser.params.defaultTimeout
                            );
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

                    describe("result page", function () {
                        it("should have the correct title.", function() {
                            expect(chaisePage.recordEditPage.getEntityTitleElement().getText()).toBe(tableParams.results.length +  " " + tableParams.table_name + " records updated successfully", "Resultset title is incorrect.");
                        });

                        it('should point to the correct link with caption.', function () {
                            var expectedLink = process.env.CHAISE_BASE_URL + "/recordset/#" +  browser.params.catalogId + "/" + schemaName + ":" + tableParams.table_name;
                            var titleLink = chaisePage.recordEditPage.getEntityTitleLinkElement();

                            expect(titleLink.getText()).toBe(tableParams.table_name, "Title of result page doesn't have the expected caption.");
                            expect(titleLink.getAttribute("href")).toContain(expectedLink , "Title of result page doesn't have the expected link.");
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
            });

            if (tableParams.testFkClear) {
                describe("User should be able to clear all foreign key values using multi form input,", function () {
                    beforeAll(function(done) {
                        browser.refresh();

                        chaisePage.recordeditPageReady();
                        done();
                    });

                    it("open the select all form and click 'clear all'", function (done) {
                        const toggleBtn = chaisePage.recordEditPage.getMultiFormToggleButton(tableParams.fkColumnName),
                              multiFormCheckbox = chaisePage.recordEditPage.getMultiFormInputCheckbox(),
                              multiFormClear = chaisePage.recordEditPage.getMultiFormClearBtn();

                        chaisePage.waitForElementCondition(EC.elementToBeClickable(toggleBtn)).then(() => {
                            return chaisePage.clickButton(toggleBtn);
                        }).then(() => {
                            return chaisePage.waitForElementCondition(EC.elementToBeClickable(multiFormCheckbox));
                        }).then(() => {
                            // select all
                            return chaisePage.clickButton(multiFormCheckbox);
                        }).then(function () {
                            // clear
                            return chaisePage.clickButton(multiFormClear);
                        }).then(() => {
                            done();
                        }).catch(chaisePage.catchTestError(done));
                    });

                    it("should submit the form and show " + tableParams.keys.length + " rows updated", function (done) {
                         // submit form
                         chaisePage.recordEditPage.submitForm();

                         // Make sure the table shows up with the expected # of rows
                         browser.wait(function() {
                             return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                                 return (ct == tableParams.keys.length);
                             });
                         }, browser.params.defaultTimeout);

                         expect(chaisePage.recordsetPage.getRows().count()).toBe(tableParams.keys.length, "Incorrect number of rows showing after update");
                         done();
                    })
                });
            }

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
