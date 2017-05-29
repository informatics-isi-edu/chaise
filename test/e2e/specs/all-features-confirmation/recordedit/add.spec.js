var chaisePage = require('../../../../utils/chaise.page.js');
var recordEditHelpers = require('../utils/recordedit-helpers.js'), chance = require('chance').Chance();
var exec = require('child_process').execSync;
var testParams = {
    tables: [{
        table_name: "accommodation",
        create_entity_displayname: "Accommodations",
        columns: [
            { name: "id", generated: true, immutable: true, title: "Id", type: "serial4", nullok: false},
            { name: "title", title: "Name of Accommodation", type: "text", nullok: false},
            { name: "website", isUrl: true, title: "Website", type: "text", comment: "A valid url of the accommodation"},
            { name: "category", isForeignKey: true, title: "Category", type: "text", comment: "Type of accommodation ('Resort/Hotel/Motel')", presentation: { type: "url", template: "{{{chaise_url}}}/record/#{{catalog_id}}/product-add:category/id=10003"}, nullok: false},
            { name: "rating", title: "User Rating", type: "float4", nullok: false},
            { name: "summary", title: "Summary", type: "longtext", nullok: false},
            { name: "description", title: "Description", type: "markdown"},
            { name: "no_of_rooms", title: "Number of Rooms", type: "int2"},
            { name: "cover", isForeignKey: true, title: "Cover Image", type: "int2", presentation: { type: "url", template: "{{{chaise_url}}}/record/#{{catalog_id}}/product-add:file/id=3005"} },
            { name: "thumbnail", isForeignKey: true, title: "Thumbnail", type: "int4"},
            { name: "opened_on", title: "Operational Since", type: "timestamptz", nullok: false },
            { name: "luxurious", title: "Is Luxurious", type: "boolean" }
        ],
        primary_keys: ["id"],
        records: 2,
        files: []
    }, {
        table_name: "file",
        columns: [
            { name: "fileid", title: "fileid", type: "int4" },
            { name: "uri", title: "uri", type: "text", isFile: true, comment: "asset/reference" },
            { name: "content_type", title: "content_type", type: "text"},
            { name: "timestamp", title: "timestamp", type: "timestamptz"},
            { name: "image_width", title: "image_width", type: "int8"},
            { name: "image_height", title: "image_height", type: "int8"}
        ],
        primary_keys: ["id"],
        create_entity_displayname: "file",
        records: 2,
        files : [{
            name: "testfile1MB.txt",
            size: "1024000",
            displaySize: "1MB",
            path: "uploadFiles/testfile1MB.txt"
        }, {
            name: "testfile500kb.png",
            size: "512000",
            displaySize: "500KB",
            path: "uploadFiles/testfile500kb.png"
        }, {
            name: "testfile5MB.pdf",
            size: "5242880",
            displaySize: "5MB",
            path: "uploadFiles/testfile5MB.pdf"
        }]
    }],
    multi_insert: {
        table_name: "accommodation",
        records: 1,
        max_input_rows: 200
    }
}

describe('Record Add', function() {

    for (var i=0; i< testParams.tables.length; i++) {

        (function(tableParams, index) {

            describe("======================================================================= \n    "
            + tableParams.records + " record(s) for table " + tableParams.table_name + ",", function() {

                beforeAll(function () {
                    browser.ignoreSynchronization=true;
                    browser.get(browser.params.url + "recordedit/#" + browser.params.catalogId + "/product-add:" + tableParams.table_name);
                    chaisePage.waitForElement(element(by.id("submit-record-button")));
                });

                describe("Presentation and validation,", function() {


                    beforeAll(function() {

                        var files = tableParams.files;
                        if (process.env.TRAVIS)   files = tableParams.files.filter(function(f) { if (!f.doNotRunInTravis) return f; });

                        files.forEach(function(f) {
                            var path = require('path').join(__dirname , "/../../" + f.path);
                            exec("perl -e 'print \"\1\" x " + f.size + "' > " + path);
                            console.log(path + " created");
                        });
                    });

                    var params = recordEditHelpers.testPresentationAndBasicValidation(tableParams);
                });

                describe("delete record, ", function() {

                    if (tableParams.records > 1) {

                        it(tableParams.records + " buttons should be visible and enabled", function() {
                            chaisePage.recordEditPage.getAllDeleteRowButtons().then(function(buttons) {
                                expect(buttons.length).toBe(tableParams.records + 1);
                                buttons.forEach(function(btn) {
                                    expect(btn.isDisplayed()).toBe(true);
                                    expect(btn.isEnabled()).toBe(true);
                                });
                            });
                        });

                        var randomNo = chaisePage.recordEditPage.getRandomInt(0, tableParams.records - 1);

                        it("click any delete button", function() {
                            chaisePage.recordEditPage.getDeleteRowButton(randomNo).then(function(button)	 {
                                chaisePage.clickButton(button);

                                browser.wait(protractor.ExpectedConditions.visibilityOf(element(by.id('delete-confirmation'))), browser.params.defaultTimeout);

                                chaisePage.recordEditPage.getDeleteModalButton().then(function(modalBtn) {
                                    chaisePage.clickButton(modalBtn);
                                    browser.sleep(50);
                                    chaisePage.recordEditPage.getAllDeleteRowButtons().then(function(buttons) {
                                        expect(buttons.length).toBe(tableParams.records);
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

                describe("Submit " + tableParams.records + " records", function() {
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
                            if (tableParams.records > 1) {

                                // if there is a file upload
                                if (tableParams.files.length) {
                                    browser.wait(ExpectedConditions.invisibilityOf($('.upload-table')), tableParams.files.length ? (tableParams.records * tableParams.files.length * browser.params.defaultTimeout) : browser.params.defaultTimeout);
                                }

                                // wait for url change
                                browser.wait(function () {
                                    return browser.driver.getCurrentUrl().then(function(url) {
                                        return url.startsWith(process.env.CHAISE_BASE_URL + "/recordedit/");
                                    });
                                }, browser.params.defaultTimeout);
                                // verify url and ct
                                browser.driver.getCurrentUrl().then(function(url) {
                                    expect(url.startsWith(process.env.CHAISE_BASE_URL + "/recordedit/")).toBe(true);

                                    browser.wait(function () {
                                        return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                                            return (ct > 0);
                                        });
                                    });

                                    chaisePage.recordsetPage.getRows().count().then(function (ct) {
                                        expect(ct).toBe(tableParams.records);
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

                    afterAll(function(done) {
                        var files = tableParams.files;
                        if (process.env.TRAVIS)   files = tableParams.files.filter(function(f) { if (!f.doNotRunInTravis) return f; });

                        files.forEach(function(f) {
                            exec('rm ' + f.path);
                        });
                        done();
                    });
                });
            });
        })(testParams.tables[i], i);
    }

    it('should load custom CSS and document title defined in chaise-config.js', function() {
        var chaiseConfig;
        browser.get(browser.params.url + "recordedit/#" + browser.params.catalogId + "/product-add:" + testParams.tables[0].table_name);
        chaisePage.waitForElement(element(by.id("submit-record-button"))).then(function() {
            return browser.executeScript('return chaiseConfig;');
        }).then(function(config) {
            chaiseConfig = config;
            console.log(chaiseConfig);
            return browser.executeScript('return $("link[href=\'' + chaiseConfig.customCSS + '\']")');
        }).then(function(elemArray) {
            expect(elemArray.length).toBeTruthy();
            return browser.getTitle();
        }).then(function(title) {
            expect(title).toEqual(chaiseConfig.headTitle);
        });
    });

    describe('When url has a prefill query string param set, ', function() {
        var testCookie = {};
        beforeAll(function() {
            // Refresh the page
            browser.get(browser.params.url + "recordedit/#" + browser.params.catalogId + "/product-add:" + testParams.tables[0].table_name);
            browser.sleep(100);

            // Write a dummy cookie for creating a record in Accommodation table
            testCookie = {
                constraintName: 'product-add_fk_category', // A FK that Accommodation table has with Category table
                rowname: {
                    value: chance.sentence()
                },
                keys: {id: 1}
            };
            browser.manage().addCookie('test', JSON.stringify(testCookie));

            // Reload the page with prefill query param in url
            browser.get(browser.params.url + "recordedit/#" + browser.params.catalogId + "/product-add:" + testParams.tables[0].table_name + '?prefill=test');
        });

        it('should pre-fill fields from the prefill cookie', function() {
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
