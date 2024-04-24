var chaisePage = require('../../../utils/chaise.page.js');
var testParams = {
    schemaName: "recordset-multi-edit",
    table_name: "multi-edit-table",
    default_page_limit: 25,
    limit: 10,
    int_23_count: 11
};

describe('Recordset edit records,', function() {

    describe("recordset shows results with no limit defined,", function() {
        beforeAll(function() {
            chaisePage.navigate(browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name);

            chaisePage.recordsetPageReady()
        });

        it("clicking edit will show forms based on the default page size of " + testParams.default_page_limit + ".", function() {
            browser.wait(function() {
                return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                    return (ct == testParams.default_page_limit);
                });
            }, browser.params.defaultTimeout);

            chaisePage.recordsetPage.getRows().count().then(function(ct) {
                expect(ct).toBe(testParams.default_page_limit);

                return chaisePage.recordsetPage.getEditRecordLink().click();
            }).then(function() {
                browser.wait(function() {
                    return chaisePage.recordEditPage.getRecordeditForms().count().then(function(ct) {
                        return (ct == testParams.default_page_limit);
                    });
                }, browser.params.defaultTimeout);

                return chaisePage.recordEditPage.getRecordeditForms().count();
            }).then(function(count) {
                expect(count).toBe(testParams.default_page_limit);
            });
        });
    });

    describe("recordset url includes a limit,", function() {
        beforeAll(function() {
            chaisePage.navigate(browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name + "?limit=" + testParams.limit);

            chaisePage.recordsetPageReady()
        });

        it("clicking edit will show forms based on the limit of " + testParams.limit + " in the uri.", function() {
            browser.wait(function() {
                return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                    return (ct == testParams.limit);
                });
            }, browser.params.defaultTimeout);

            chaisePage.recordsetPage.getRows().count().then(function(ct) {
                expect(ct).toBe(testParams.limit);

                return chaisePage.recordsetPage.getEditRecordLink().click();
            }).then(function() {
                browser.wait(function() {
                    return chaisePage.recordEditPage.getRecordeditForms().count().then(function(ct) {
                        return (ct == testParams.limit);
                    });
                }, browser.params.defaultTimeout);

                return chaisePage.recordEditPage.getRecordeditForms().count();
            }).then(function(count) {
                expect(count).toBe(testParams.limit);
            });
        });
    });

    describe("recordset url includes a filter of int=23", function() {
        beforeAll(function() {
            chaisePage.navigate(browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name + "/int=23");

            chaisePage.recordsetPageReady()
        });

        it("without a limit, clicking edit will show all forms with int=23.", function() {
            browser.wait(function() {
                return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                    return (ct == testParams.int_23_count);
                });
            }, browser.params.defaultTimeout);

            chaisePage.recordsetPage.getRows().count().then(function(ct) {
                expect(ct).toBe(testParams.int_23_count);

                return chaisePage.recordsetPage.getEditRecordLink().click();
            }).then(function() {
                browser.wait(function() {
                    return chaisePage.recordEditPage.getRecordeditForms().count().then(function(ct) {
                        return (ct == testParams.int_23_count);
                    });
                }, browser.params.defaultTimeout);

                return chaisePage.recordEditPage.getRecordeditForms().count();
            }).then(function(count) {
                expect(count).toBe(testParams.int_23_count);
            });
        });

        it("with a limit of " + testParams.limit + ", clicking edit will show all forms with int=23.", function() {
            chaisePage.navigate(browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name + "/int=23?limit=" + testParams.limit);

            chaisePage.recordsetPageReady()

            browser.wait(function() {
                return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                    return (ct == testParams.limit);
                });
            }, browser.params.defaultTimeout);

            chaisePage.recordsetPage.getRows().count().then(function(ct) {
                expect(ct).toBe(testParams.limit);

                return chaisePage.recordsetPage.getEditRecordLink().click();
            }).then(function() {
                browser.wait(function() {
                    return chaisePage.recordEditPage.getRecordeditForms().count().then(function(ct) {
                        return (ct == testParams.limit);
                    });
                }, browser.params.defaultTimeout);

                return chaisePage.recordEditPage.getRecordeditForms().count();
            }).then(function(count) {
                expect(count).toBe(testParams.limit);
            });
        });
    });
});
