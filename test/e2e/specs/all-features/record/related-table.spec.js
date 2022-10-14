var chaisePage = require('../../../utils/chaise.page.js');
var recordHelpers = require('../../../utils/record-helpers.js');
var EC = protractor.ExpectedConditions;
var moment = require('moment');

var testParams = {
    schemaName: "product-unordered-related-tables-links",
    table_name: "accommodation",
    key: {
        name: "id",
        value: "2004",
        operator: "="
    },
    headers: [
        "booking", // normal
        "schedule", // has search
        "media", // has row_markdown_pattern
        "association_table", // association
        "accommodation_image", // association with page_size
        "association_table_markdown", // association with markdown
        "related_table_2", // related entity with path length 3, wait_for entity set but no markdown patt
        "table_w_aggregates", // related entity with aggregate columns
        "table_w_invalid_row_markdown_pattern", // related entity with invalid row_markdown_pattern
        "inbound related with display.wait_for entityset", //related entity with wait_for entityset and markdown patt
        "inbound related with display.wait_for agg", //related entity with wait_for agg and markdown pattern
        "inbound related with filter on main table", // related entity with filter on main table
        "inbound related with filter on related table", // related entity with filter on related table
        "association with filter on main table",
        "association with filter on related table", // association with filter on related table
        "path of length 3 with filters" // path of length 3 with filters
    ],
    tocHeaders: [
        "Summary", "booking (6)", "schedule (2)", "media (1)", "association_table (1)",
        "accommodation_image (2+)", "association_table_markdown (1)", "related_table_2 (1)",
        "table_w_aggregates (2)", "table_w_invalid_row_markdown_pattern (1)",
        "inbound related with display.wait_for entityset (3)",
        "inbound related with display.wait_for agg (3)",
        "inbound related with filter on main table (6)",
        "inbound related with filter on related table (1)",
        "association with filter on main table (1)",
        "association with filter on related table (1)",
        "path of length 3 with filters (1)"
    ]
};

var pageReadyCondition = function () {
    chaisePage.waitForElementInverse(element(by.id("spinner")));

    // make sure the loader is hidden
    chaisePage.waitForElementInverse(element(by.id('rt-loading')));
};


describe ("Viewing exisiting record with related entities, ", function () {
    beforeAll(function () {
        var keys = [];
        keys.push(testParams.key.name + testParams.key.operator + testParams.key.value);
        browser.ignoreSynchronization=true;
        var url = browser.params.url + "/record/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name + "/" + keys.join("&");
        browser.get(url);

        pageReadyCondition();
    });

    it ("should show the related entities in the expected order.", function () {
        // wait for expected # of related tables to be visible before checking titles
        // this ensures the page content is loaded AND visible
        browser.wait(function() {
            return chaisePage.recordPage.getSidePanelHeadings().count().then(function(ct) {
                return (ct == testParams.tocHeaders.length);
            });
        }, browser.params.defaultTimeout);
        expect(chaisePage.recordPage.getDisplayedRelatedTableTitles()).toEqual(testParams.headers, "list of related table accordion headers is incorret");
    });

    it ("should show the related table names in the correct order in the Table of Contents", function () {
        expect(chaisePage.recordPage.getSidePanelTableTitles()).toEqual(testParams.tocHeaders, "list of related tables in toc is incorrect");
    });

    describe("share popup when the citation annotation has wait_for of all-outbound", function () {
        var RIDLink = browser.params.url + "/record/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name;
        RIDLink += "/RID=" + chaisePage.getEntityRow(testParams.schemaName, testParams.table_name, [{column: testParams.key.name, value: testParams.key.value}]).RID;

        var keys = [];
        keys.push(testParams.key.name + testParams.key.operator + testParams.key.value);
        recordHelpers.testSharePopup({
            permalink: RIDLink,
            // the table has history-capture: false
            hasVersionedLink: false,
            verifyVersionedLink: false,
            citation: "Super 8 North Hollywood Motel, accommodation_outbound1_outbound1 two https://www.kayak.com/hotels/Super-8-North-Hollywood-c31809-h40498/2016-06-09/2016-06-10/2guests (" + moment().format("YYYY") + ").",
            bibtextFile: false, // we don't need to test this here as well (it has been tested in record presentation)
            title: "Share and Cite"
        });
    })

    var related_table = {
        comment: "inbound related, no applink or row_markdown_pattern",
        schemaName: "product-unordered-related-tables-links",
        displayname: "booking",
        name: "booking",
        baseTable:"Accommodations",
        count: 6,
        canDelete: true,
        canEdit: true,
        inlineComment: true,
        comment: "booking inline comment",
        viewMore: {
            displayname: "booking",
            filter: "Accommodations\nSuper 8 North Hollywood Motel"
        },
        rowValues: [
            ["125.0000","2016-03-12 00:00:00"],
            ["100.0000","2016-06-01 00:00:00"],
            ["110.0000","2016-05-19 01:00:00"],
            ["120.0000","2015-11-10 00:00:00"],
            ["180.0000","2016-09-04 01:00:00"],
            ["80.0000","2016-01-01 00:00:00"],
        ],
        rowViewPaths: [
            [{column: "accommodation_id", value: "2004"}, {column: "id", value: "8"}],
            [{column: "accommodation_id", value: "2004"}, {column: "id", value: "9"}],
            [{column: "accommodation_id", value: "2004"}, {column: "id", value: "10"}],
            [{column: "accommodation_id", value: "2004"}, {column: "id", value: "11"}],
            [{column: "accommodation_id", value: "2004"}, {column: "id", value: "12"}],
            [{column: "accommodation_id", value: "2004"}, {column: "id", value: "13"}]
        ],
        add: {
            tableName: "booking",
            schemaName: "product-unordered-related-tables-links",
            relatedDisplayname: "booking",
            tableDisplayname: "booking",
            prefilledValues: {
                "fk_1": "Super 8 North Hollywood Motel", // the same fk
                "fk_2": "Super 8 North Hollywood Motel", // superset fk
                "fk2_col": "4", // the second column of fk_2
                "fk_3": "", // supserset fk but nullok
                "fk3_col1": "",
                "fk_4": "Super 8 North Hollywood Motel", // supserset fk
                "fk_5": "4: four" // the second column of fk_2 that is a fk to another table
            },
            rowValuesAfter: [
                ["247.0000",""],
                ["100.0000","2016-06-01 00:00:00"],
                ["110.0000","2016-05-19 01:00:00"],
                ["120.0000","2015-11-10 00:00:00"],
                ["180.0000","2016-09-04 01:00:00"],
                ["80.0000","2016-01-01 00:00:00"],
            ]
        }
    };
    describe("for a related entity, ", function () {
        recordHelpers.testRelatedTable(related_table, pageReadyCondition);
        recordHelpers.testAddRelatedTable(related_table.add, false, function () {
            var input = chaisePage.recordEditPage.getInputById(0, "price");
            return input.sendKeys("247.00");
        });
    });

    var rel_applink_search = {
        comment: "inbound related, has applink defined as search",
        schemaName: "product-unordered-related-tables-links",
        displayname: "schedule",
        name: "schedule",
        baseTable:"Accommodations",
        count: 2,
        viewMore: {
            displayname: "schedule",
            filter: "Accommodations\nSuper 8 North Hollywood Motel"
        }
    };
    describe("for a related entity with search applink, ", function () {
        recordHelpers.testRelatedTable(rel_applink_search, pageReadyCondition);
    });

    var rel_name_with_row_markdown_pattern = {
        comment: "inbound related, has row_markdown_pattern",
        schemaName: "product-unordered-related-tables-links",
        displayname: "media",
        name: "media",
        baseTable:"Accommodations",
        count: 1,
        canDelete: true,
        canEdit: false,
        markdownValue: "<p>2004</p>\n",
        isMarkdown: true
    };
    describe("for a related entity with row_markdown_pattern, ", function () {
        recordHelpers.testRelatedTable(rel_name_with_row_markdown_pattern, pageReadyCondition);
    });

    var association_table = {
        comment: "association table",
        schemaName: "product-unordered-related-tables-links",
        displayname: "association_table",
        name: "association_table",
        relatedName: "related_table",
        baseTable:"Accommodations",
        isAssociation: true,
        viewMore: {
            displayname: "related_table",
            filter: "base table association related\nSuper 8 North Hollywood Motel"
        },
        rowValues: [
            ["Television"]
        ],
        rowViewPaths: [
            [{column: "id", value: "1"}]
        ],
        count: 1,
        canEdit: true,
        add: {
            relatedDisplayname: "association_table",
            tableDisplayname: "related_table",
            modalTitle: "Link related_table to Accommodations: Super 8 North Hollywood Motel",
            totalCount: 5,
            existingCount: 1,
            disabledRows: ["1"],
            search: {
                term: "television|Coffee",
                afterSearchCount: 2,
                afterSearchDisabledRows: ["1"]
            },
            selectOptions: [1, 2, 3, 4],
            rowValuesAfter: [
                ["Television"],
                ["Air Conditioning"],
                ["Coffee Maker"],
                ["UHD TV"],
                ["Space Heater"]
            ]
        },
        unlink: {
            // we unlink rows 2 and 4 ("Air Conditioning" and "UHD TV")
            catalogId: browser.params.catalogId,
            relatedDisplayname: "association_table",
            modalTitle: "Unlink association_table from Accommodations : Super 8 North Hollywood Motel",
            totalCount: 5,
            postDeleteMessage: "2 records successfully unlinked.\n\nClick OK to dismiss this dialog.",
            countAfterUnlink: 3,
            rowValuesAfter: [
                ["Television"],
                ["Coffee Maker"],
                ["Space Heater"]
            ],
            failedPostDeleteMessage: "2 records could not be unlinked. Check the error details below to see more information.\n\nClick OK to dismiss this dialog.\nShow Error Details",
            // we unlink row 5 ("Space Heater")
            aclPostDeleteMessage: "1 record successfully unlinked.\n\nClick OK to dismiss this dialog.",
            countAfterAclUnlink: 2,
            rowValuesAfterAclRemove: [
                ["Television"],
                ["Coffee Maker"]
            ]
        }
    };
    describe("for a pure and binary association,", function () {
        recordHelpers.testRelatedTable(association_table, pageReadyCondition);

        recordHelpers.testAddAssociationTable(association_table.add, false, pageReadyCondition);

        recordHelpers.testBatchUnlinkAssociationTable(association_table.unlink, false, pageReadyCondition);

        // test trying to unlink 2 rows where 1 is allowed and 1 is not
        // verifies the error case works as expected and rows are still selected after failure
        // need to attach a "postLogin" function to reload the record page we are testing
        recordHelpers.testBatchUnlinkDynamicAclsAssociationTable(association_table.unlink, false, pageReadyCondition, function () {
            var keys = [];
            keys.push(testParams.key.name + testParams.key.operator + testParams.key.value);
            browser.ignoreSynchronization=true;
            var url = browser.params.url + "/record/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name + "/" + keys.join("&");
            browser.get(url);

            pageReadyCondition();
        });
    });

    var association_with_page_size = {
        comment: "association table, has page_size",
        schemaName: "product-unordered-related-tables-links",
        displayname: "accommodation_image",
        name: "accommodation_image",
        relatedName: "related_name",
        baseTable:"Accommodations",
        count: 3,
        page_size: 2,
        isAssociation: true,
        canEdit: true
    };
    describe("for a pure and binary association with page_size and hide_row_count, ", function () {
        recordHelpers.testRelatedTable(association_with_page_size, pageReadyCondition);

        it ("Opened modal by `Link` button should honor the page_size and hide_row_count.", function () {
            var addRelatedRecordLink = chaisePage.recordPage.getAddRecordLink(association_with_page_size.displayname);
            addRelatedRecordLink.click().then(function(){
                chaisePage.waitForElement(chaisePage.recordEditPage.getModalTitle());
                return chaisePage.recordEditPage.getModalTitle().getText();
            }).then(function (title) {
                expect(title).toBe("Link file to Accommodations: Super 8 North Hollywood Motel", "title missmatch.");

                browser.wait(function () {
                    return chaisePage.recordsetPage.getModalRows().count().then(function (ct) {
                        return (ct == 2);
                    });
                });
                return chaisePage.recordsetPage.getModalRows().count();
            }).then(function(ct){
                expect(ct).toBe(2, "association count missmatch for file domain table.");

                expect(chaisePage.recordsetPage.getTotalCount().getText()).toBe("Displaying\nfirst 2\nrecords", "hide_row_count not honored");

                return chaisePage.recordEditPage.getModalCloseBtn().click();
            }).catch(function(error) {
                console.log(error);
                expect('There was an error in this promise chain').toBe('Please see error message.');
            });
        });
    });

    var association_with_markdown = {
        comment: "association table, has markdown",
        schemaName: "product-unordered-related-tables-links",
        displayname: "association_table_markdown",
        name: "association_table_markdown",
        entityMarkdownName: ' <strong class="vocab">1:Television</strong> ',
        relatedName: "related_table",
        baseTable:"Accommodations",
        isAssociation: true,
        isMarkdown: true,
        count: 1,
        canEdit: true,
        canDelete: true
    };
    describe("for a pure and binary association with row_markdown_pattern, ", function () {
        recordHelpers.testRelatedTable(association_with_markdown, pageReadyCondition);
    });

    // When rows are added to association_table, it affects this test.
    // data relies on rows from p&b unlink tests above
    var path_related = {
        comment: "related with a path of length 3",
        schemaName: "product-unordered-related-tables-links",
        displayname: "related_table_2",
        name: "related_table_2",
        baseTable:"Accommodations",
        viewMore: {
            displayname: "related_table_2",
            filter: "base table association related\nSuper 8 North Hollywood Motel"
        },
        rowValues: [
            ["one"],
            ["three"],
        ],
        rowViewPaths: [
            [{column: "id", value: "1"}], [{column: "id", value: "3"}]
        ],
        count: 2, // by load time it's one but when we add another related for the other table this should be updated too.
        canEdit: true,
        canCreate: false,
        canDelete: true
    };
    describe("for a related entity with a path of length 3, ", function () {
        recordHelpers.testRelatedTable(path_related, pageReadyCondition);
    });

    var related_w_agg = {
        comment: "related with aggregate columns",
        schemaName: "product-unordered-related-tables-links",
        displayname: "table_w_aggregates",
        name: "table_w_aggregates",
        baseTable:"Accommodations",
        viewMore: {
            displayname: "table_w_aggregates",
            filter: "fk_to_accommodation\nSuper 8 North Hollywood Motel"
        },
        rowValues: [
            ["1", "100", "100", "1", "1", "virtual 100 with Super 8 North Hollywood Motel"],
            ["2", "101", "101", "1", "1", "virtual 101 with Super 8 North Hollywood Motel"],
        ],
        rowViewPaths: [
            [{column: "id", value: "1"}], [{column: "id", value: "2"}]
        ],
        count: 2,
        canEdit: true,
        canCreate: true,
        canDelete: true
    };
    describe("for a related entity with aggregate columns.", function () {
        recordHelpers.testRelatedTable(related_w_agg, pageReadyCondition);
    });

    var related_w_invalid_row_markdown_pattern = {
        comment: "has markdown that results in empty string",
        schemaName: "product-unordered-related-tables-links",
        displayname: "table_w_invalid_row_markdown_pattern",
        name: "table_w_invalid_row_markdown_pattern",
        baseTable:"Accommodations",
        viewMore: {
            name: "table_w_invalid_row_markdown_pattern",
            displayname: "table_w_invalid_row_markdown_pattern",
            filter: "Accommodations\nSuper 8 North Hollywood Motel"
        },
        rowValues: [
            ["four"]
        ],
        rowViewPaths: [
            [{column: "id", value: "2004"}]
        ],
        count: 1,
        canEdit: true
    };
    describe("for a related table with invalid row_markdown_pattern, ", function () {
        recordHelpers.testRelatedTable(related_w_invalid_row_markdown_pattern, pageReadyCondition);
    });

    var related_w_entityset_waitfor = {
        comment: "related table, has waitfor entityset and markdown_pattern",
        schemaName: "product-unordered-related-tables-links",
        displayname: "inbound related with display.wait_for entityset",
        name: "accommodation_inbound1",
        baseTable:"Accommodations",
        markdownValue: "<p>accommodation_inbound1 seven, accommodation_inbound1 eight, accommodation_inbound1 nine (accommodation_inbound2 seven, accommodation_inbound2 eight, accommodation_inbound2 nine)</p>\n",
        isMarkdown: true,
        count: 3,
        canEdit: true,
        canDelete: true
    };
    describe("for a related entity with wait_for entity set and markdown_pattern", function () {
        recordHelpers.testRelatedTable(related_w_entityset_waitfor, pageReadyCondition);
    });

    var related_w_agg_waitfor = {
        comment: "related table, has waitfor entityset and markdown_pattern",
        schemaName: "product-unordered-related-tables-links",
        displayname: "inbound related with display.wait_for agg",
        name: "accommodation_inbound3",
        baseTable:"Accommodations",
        markdownValue: "<p>accommodation_inbound3 seven, accommodation_inbound3 eight, accommodation_inbound3 nine (3)</p>\n",
        isMarkdown: true,
        count: 3,
        canEdit: true,
        canDelete: true
    };
    describe("for a related entity with wait_for aggregate and markdown_pattern", function () {
        recordHelpers.testRelatedTable(related_w_agg_waitfor, pageReadyCondition);
    });

    // the rest of test cases are special cases that we don't need to run on CI
    if (process.env.CI) return;

    // these test cases rely on the previous related and assoc tests
    // since they are basically the same path with just added filters
    describe("regarding usage of filter in source", function () {
        var related_w_filter_on_main = {
          comment: "inbound related, filter on main",
          schemaName: "product-unordered-related-tables-links",
          displayname: "inbound related with filter on main table",
          name: "booking",
          baseTable:"Accommodations",
          count: 2,
          rowValues: [
              ["247.0000",""],
              ["100.0000","2016-06-01 00:00:00"],
              ["110.0000","2016-05-19 01:00:00"],
              ["120.0000","2015-11-10 00:00:00"],
              ["180.0000","2016-09-04 01:00:00"],
              ["80.0000","2016-01-01 00:00:00"],
          ],
          canCreate: true
        };
        describe("for a related entity with filter on main table,", function () {
            recordHelpers.testRelatedTable(related_w_filter_on_main, pageReadyCondition);
        });

        var related_w_filter_on_related = {
            comment: "inbound related, filter on related",
            schemaName: "product-unordered-related-tables-links",
            displayname: "inbound related with filter on related table",
            name: "booking",
            baseTable:"Accommodations",
            count: 2,
            viewMore: {
                displayname: "booking",
                filter: "Accommodations\nSuper 8 North Hollywood Motel"
            },
            rowValues: [
                ["247.0000",""], // created by another test case
                ["80.0000","2016-01-01 00:00:00"]
            ],
            canCreate: false
        };
        describe("for a related entity with filter on related table", function () {
            recordHelpers.testRelatedTable(related_w_filter_on_related, pageReadyCondition);
        });

        var assoc_w_filter_on_main = {
          comment: "assoc related, filter on main",
          schemaName: "product-unordered-related-tables-links",
          displayname: "association with filter on main table",
          name: "association_table",
          relatedName: "related_table",
          baseTable:"Accommodations",
          isAssociation: true,
          count: 2,
          viewMore: {
              displayname: "related_table",
              filter: "base table association related\nSuper 8 North Hollywood Motel"
          },
          rowValues: [
              ["Television"],
              ["Coffee Maker"]
          ],
          canCreate: true
        };
        describe("pure and binary association with filter on main table,", function () {
            recordHelpers.testRelatedTable(assoc_w_filter_on_main, pageReadyCondition);
        });

        // NOTE this related entity doesn't have any value on load,
        // but the add p&b test will add the required row for this.
        var assoc_w_filter_on_assoc = {
            comment: "assoc related, filter on assoc",
            schemaName: "product-unordered-related-tables-links",
            displayname: "association with filter on assoc table",
            name: "association_table",
            relatedName: "related_table",
            baseTable:"Accommodations",
            isAssociation: true,
            count: 1,
            viewMore: {
                displayname: "related_table",
                filter: "base table association related\nSuper 8 North Hollywood Motel"
            },
            rowValues: [
                ["Coffee Maker"]
            ],
            canCreate: false
        };
        describe(" pure and binary association with filter on association table,", function () {
            recordHelpers.testRelatedTable(assoc_w_filter_on_assoc, pageReadyCondition);
        });

        var assoc_w_filter_on_related = {
            comment: "assoc related, filter on related",
            schemaName: "product-unordered-related-tables-links",
            displayname: "association with filter on related table",
            name: "association_table",
            relatedName: "related_table",
            baseTable:"Accommodations",
            isAssociation: true,
            count: 1,
            rowValues: [
                ["Television"]
            ],
            rowViewPaths: [
                [{column: "id", value: "1"}]
            ],
            canCreate: true,
            add: {
              relatedDisplayname: "association with filter on related table",
              tableDisplayname: "related_table",
              modalTitle: "Link related_table to Accommodations: Super 8 North Hollywood Motel",
              totalCount: 2,
              existingCount: 1,
              disabledRows: ["1"],
              selectOptions: [1],
              rowValuesAfter: [
                  ["Television"],
                  ["Air Conditioning"]
              ]
          },
        };
        describe("for a pure and binary association with filter on related table", function () {
            recordHelpers.testRelatedTable(assoc_w_filter_on_related, pageReadyCondition);

            recordHelpers.testAddAssociationTable(assoc_w_filter_on_related.add, false, pageReadyCondition);
        });

        var path_related_w_filter = {
            comment: "related with a path of length 3",
            schemaName: "product-unordered-related-tables-links",
            displayname: "path of length 3 with filters",
            name: "related_table_2",
            baseTable:"Accommodations",
            viewMore: {
                displayname: "related_table_2",
                filter: "base table association related\nSuper 8 North Hollywood Motel"
            },
            rowValues: [
                ["two"],
                ["three"]
            ],
            rowViewPaths: [
                [{column: "id", value: "2"}],
                [{column: "id", value: "3"}]
            ],
            count: 2, // one row is deleted by unlink test, another is added by add p&b filter on assoc
        };
        describe("for a related entity with a path of length 3 with filter", function () {
            recordHelpers.testRelatedTable(path_related_w_filter, pageReadyCondition);

            it ("add button should not be available", function () {
                var btn = chaisePage.recordPage.getAddRecordLink(path_related_w_filter.displayname);
                expect(btn.isPresent()).toBeFalsy();
            });
        });
    });

    describe("for a pure and binary association with a null value for the key on main", function () {
        var displayname = "association_table_null_keys",
            tablename = "Accommodations",
            columnname = "nullable_assoc_key",
            addBtn;

        beforeAll(function() {
            pageReadyCondition();
            // click show empty sections button
            chaisePage.recordPage.getShowAllRelatedEntitiesButton().click().then(function () {
                addBtn = chaisePage.recordPage.getAddRecordLink(displayname, true);
            });
        });

        it("should disable the link record button", function () {
            expect(addBtn.isEnabled()).toBeFalsy();
        });

        it("should have the proper tooltip", function () {
            chaisePage.recordPage.getColumnCommentHTML(addBtn.element(by.xpath("./.."))).then(function(comment) {
                expect(comment).toBe("'Unable to connect to <code>" + displayname + "</code> records until <code>" + columnname + "</code> in <code>" + tablename + "</code> is set.'", "Incorrect tooltip on disabled Add button");
            });
        });
    });

    describe("for a inbound fk with a null value for the key on main", function () {
        var displayname = "inbound_null_key",
            tablename = "Accommodations",
            columnname = "nullable_assoc_key",
            addBtn;

        beforeAll(function() {
            pageReadyCondition();

            addBtn = chaisePage.recordPage.getAddRecordLink("inbound_null_key", true);
        });

        it("should disable the add record button", function () {
            expect(addBtn.isEnabled()).toBeFalsy();
        });

        it("should have the proper tooltip", function () {
            chaisePage.recordPage.getColumnCommentHTML(addBtn.element(by.xpath("./.."))).then(function(comment) {
                expect(comment).toBe(
                  `'Unable to create <code>${displayname}</code> records for this <code>${tablename}</code> until <code>${colname}</code> in this <code>${tablename}</code> is set'`,
                  "Incorrect tooltip on disabled Add button"
                );
            });
        });
    });

    describe("for a pure and binary association with a null value for the key on the leaf table", function () {
        it("should add a not null filter and only show 2 of the 5 rows for related_table_null_key", function () {
            var addBtn = chaisePage.recordPage.getAddRecordLink("association_table_null_keys2", true);
            expect(addBtn.isEnabled()).toBeTruthy();

            addBtn.click().then(function () {
                browser.wait(function () {
                    return chaisePage.recordsetPage.getModalRows().count().then(function (ct) {
                        return (ct == 2);
                    });
                });

                expect(chaisePage.recordsetPage.getModalRows().count()).toBe(2, "Number of rows after applying not null filter is incorrect")
            });
        });
    });
});

describe("For scroll to query parameter", function() {
    var displayname = "table_w_aggregates";

    beforeAll(function () {
        var keys = [];
        keys.push(testParams.key.name + testParams.key.operator + testParams.key.value);
        browser.ignoreSynchronization=true;
        var url = browser.params.url + "/record/#" + browser.params.catalogId + "/" + testParams.schemaName + ":" + testParams.table_name + "/" + keys.join("&") + "?scrollTo=" + displayname;
        browser.get(url);

        pageReadyCondition();
    });

    it("should scroll to the related table.", function () {
        var heading = chaisePage.recordPage.getRelatedTableAccordion(displayname);

        browser.wait(function () {
            return heading.isDisplayed().then(function (bool) {
                return bool;
            }).catch(function () {
                // the element might not be even in the DOM
                return false;
            })
        });

        heading.getAttribute("class").then(function(className) {
            expect(className).toContain("panel-open", "Related table panel is not open when autoscrolled.");
        });
    });
});
