var testConfiguration = browser.params.configuration;
var chaisePage = require('../../../utils/chaise.page.js');
var recordEditHelpers = require('../../../utils/recordedit-helpers.js'), chance = require('chance').Chance();
var exec = require('child_process').execSync;
var moment = require('moment');

// take a look at the comments in recordedit-helpers.js for the expected structure of tableParams.
var currentTimestampTime = moment().format("x");
var testParams = {
    tables: [{
        schema_name: "product-add",
        table_name: "accommodation",
        table_displayname: "Accommodations",
        table_comment: "List of different types of accommodations",
        not_travis: true,
        primary_keys: ["id"],
        columns: [
            { name: "id", generated: true, immutable: true, title: "Id", type: "serial4", nullok: false},
            { name: "title", title: "Name of Accommodation", type: "text", nullok: false},
            { name: "website", title: "Website", type: "text", comment: "A valid url of the accommodation"},
            { name: "category", title: "Category", type: "text", nullok: false, isForeignKey: true,  count: 5, totalCount: 5, table_title: "Categories", comment: "Type of accommodation ('Resort/Hotel/Motel')"}, // the total count is the total number of rows in the category.json data file
            { name: "rating", title: "User Rating", type: "float4", nullok: false},
            { name: "summary", title: "Summary", type: "longtext", nullok: false},
            { name: "description", title: "Description", type: "markdown"},
            { name: "json_col", title: "json_col", type:"json"},
            { name: "no_of_rooms", title: "Number of Rooms", type: "int2"},
            { name: "opened_on", title: "Operational Since", type: "timestamptz", nullok: false },
            { name: "date_col", title: "date_col", type: "date"},
            { name: "luxurious", title: "Is Luxurious", type: "boolean" }
        ],
        inputs: [
            {"title": "new title 1", "website": "https://example1.com", "category": {index: 0, value: "Hotel"},
             "rating": "1", "summary": "This is the summary of this column 1.", "description": "## Description 1", "json_col": JSON.stringify({"items": {"qty": 6,"product": "apple"},"customer": "Nitish Sahu"},undefined,2),
             "no_of_rooms": "1", "opened_on": moment("2017-01-01 01:01:01", "YYYY-MM-DD hh:mm:ss"), "date_col": "2017-01-01", "luxurious": false},
            {"title": "new title 2", "website": "https://example2.com", "category": {index: 1, value: "Ranch"},
             "rating": "2",  "summary": "This is the summary of this column 2.", "description": "## Description 2", "json_col": JSON.stringify({"items": {"qty": 6,"product": "apple"},"customer": "Nitish Sahu"},undefined,2),
             "no_of_rooms": "2", "opened_on": moment("2017-02-02 02:02:02", "YYYY-MM-DD hh:mm:ss"), "date_col": "2017-02-02", "luxurious":  true}
        ],
        formsAfterInput: 3,
        result_columns: [
            "title", "website", "product-add_fk_category", "rating", "summary", "description", "json_col", "no_of_rooms", "opened_on", "date_col", "luxurious"
        ],
        results: [
            ["new title 1",  {"link":"https://example1.com/", "value":"Link to Website"}, {"link":"{{{chaise_url}}}/record/#{{catalog_id}}/product-add:category/term=Hotel", "value":"Hotel"}, "1.0000", "This is the summary of this column 1.", "Description 1", JSON.stringify({"items": {"qty": 6,"product": "apple"},"customer": "Nitish Sahu"},undefined,2), "1", "2017-01-01 01:01:01", "2017-01-01", "false"],
            ["new title 2",  {"link":"https://example2.com/", "value":"Link to Website"}, {"link":"{{{chaise_url}}}/record/#{{catalog_id}}/product-add:category/term=Ranch", "value":"Ranch"}, "2.0000", "This is the summary of this column 2.", "Description 2", JSON.stringify({"items": {"qty": 6,"product": "apple"},"customer": "Nitish Sahu"},undefined,2), "2", "2017-02-02 02:02:02", "2017-02-02", "true"]
        ],
        files: []
    }, {
       schema_name: "product-add",
       table_name: "file",
       table_displayname: "file",
       table_comment: "asset/object",
       not_travis: !process.env.SAUCE,
       primary_keys: ["id"],
       columns: [
           { name: "fileid", title: "fileid", type: "int4" },
           { name: "uri", title: "uri", type: "text", isFile: true, comment: "asset/reference" },
           { name: "timestamp_txt", title: "timestamp_txt", type: "text"},
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
           ["1", {"link": "/hatrac/js/chaise/" + currentTimestampTime + "/1/3a8c740953a168d9761d0ba2c9800475:", "value": "testfile1MB.txt"}, "testfile1MB.txt", "1,024,000"],
           ["2", {"link": "/hatrac/js/chaise/" + currentTimestampTime + "/2/2ada69fe3cdadcefddc5a83144bddbb4:", "value": "testfile500kb.png"}, "testfile500kb.png", "512,000"]
       ],
       files : [{
           name: "testfile1MB.txt",
           size: "1024000",
           displaySize: "1MB",
           path: "testfile1MB.txt"
       }, {
           name: "testfile500kb.png",
           size: "512000",
           displaySize: "500KB",
           path: "testfile500kb.png"
       }, {
           name: "testfile5MB.txt",
           size: "5242880",
           displaySize: "5MB",
           path: "testfile5MB.txt"
       }]
    }]
};
var mdHelp ={
        raw_bold1:"**Something Bold**",
        raw_bold2:"__Something Bold__",
        md_bold:"<strong>Something Bold</strong>",
        raw_italic1:"*Some Italic*",
        raw_italic2:"_Some Italic_",
        md_italic:"<em>Some Italic</em>",
        raw_strike:"~~strikethrough text~~",
        md_strike:"<strike>strikethrough text</strike>"
};
// keep track of namespaces that we use, so we can delete them afterwards
if (!process.env.SAUCE) {
    testConfiguration.hatracNamespaces.push(process.env.ERMREST_URL.replace("/ermrest", "") + "/hatrac/js/chaise/" + currentTimestampTime);
}

describe('Record Add', function() {

    for (var i=0; i< testParams.tables.length; i++) {

        (function(tableParams, index) {

            describe("======================================================================= \n    "
            + tableParams.inputs.length + " record(s) for table " + tableParams.table_name + ",", function() {

                beforeAll(function () {
                    browser.ignoreSynchronization=true;
                    browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/"+tableParams.schema_name+":" + tableParams.table_name);
                    chaisePage.waitForElement(element(by.id("submit-record-button")));
                });

                describe("Presentation and validation,", function() {

                    if (!process.env.SAUCE && tableParams.files.length > 0) {
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
                            it("should click and add an extra record.", function() {
                                chaisePage.recordEditPage.getAddRowButton().then(function(button) {
                                    chaisePage.clickButton(button);
                                });
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
                                chaisePage.clickButton(button);

                                browser.wait(protractor.ExpectedConditions.visibilityOf(element(by.id('delete-confirmation'))), browser.params.defaultTimeout);

                                chaisePage.recordEditPage.getDeleteModalButton().then(function(modalBtn) {
                                    chaisePage.clickButton(modalBtn);
                                    browser.sleep(50);
                                    chaisePage.recordEditPage.getAllDeleteRowButtons().then(function(buttons) {
                                        expect(buttons.length).toBe(tableParams.formsAfterInput - 1);
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
                    recordEditHelpers.testSubmission(tableParams);
                });

                if (!process.env.SAUCE && tableParams.files.length > 0) {
                    afterAll(function(done) {
                        recordEditHelpers.deleteFiles(tableParams.files);
                        console.log("\n");
                        done();
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
                    constraintName: 'npH9l-Il-ZAadyQ8VTPStA', // A FK that Accommodation table has with Category table, column._name
                    columnName: 'npH9l-Il-ZAadyQ8VTPStA',
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
            browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/product-add:accommodation");
            helpBtn = element.all(by.css('button[title=Help]')).get(0);
            chaisePage.waitForElement(helpBtn);
        });

            // TODO: multiple issues with this. promise chaining not done right so execution flow seems like it should fail
            // , only need to verify the url changed
            // there's no variablility because it's static so no need to exhaustively test
            it("should open a new window with the help page.",function(){
                helpBtn.click();
                browser.getAllWindowHandles().then(function(handles){
                return handles;
            }).then(function(handles) {
                allWindows = handles;
                return browser.switchTo().window(allWindows[1]);
            }).then(function() {
                return chaisePage.waitForElement(element(by.id("mdhelp-record")));
            }).then(function() {
                expect(element(by.id('mainTable')).all(by.tagName('tr')).count()).toBe(18,'Table row count could not be matched.');
                expect(element(by.id('rBold1')).getText()).toBe(mdHelp.raw_bold1,'First raw Bold text help not found');
                expect(element(by.id('rBold2')).getText()).toBe(mdHelp.raw_bold2,'Second raw Bold text help not found');
                expect(element(by.id('oBold')).getAttribute('innerHTML')).toBe(mdHelp.md_bold,'Markdown Bold text help not found');
                expect(element(by.id('rItalic1')).getText()).toBe(mdHelp.raw_italic1,'First raw Italic text help not found');
                expect(element(by.id('rItalic2')).getText()).toBe(mdHelp.raw_italic2,'Second raw Italic text help not found');
                expect(element(by.id('oItalic')).getAttribute('innerHTML')).toBe(mdHelp.md_italic,'Markdown Italic text help not found');
                expect(element(by.id('rStrike1')).getText()).toBe(mdHelp.raw_strike,'Strikethrough text help not found');
                expect(element(by.id('oStrike')).getAttribute('innerHTML')).toBe(mdHelp.md_strike,'Markdown Strike text help not found');
            }).then(function() {
                // - Go back to initial Record page
                browser.close();
                browser.switchTo().window(allWindows[0]);
            }).catch(function(error) {
                console.dir(error);
                expect('Something went wrong with this promise chain.').toBe('Please see error message.','While checking markdown help page');
            });
        });
    });
});
