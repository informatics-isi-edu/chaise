var chaisePage = require('../../../utils/chaise.page.js');
var recordHelpers = require('../../../utils/record-helpers.js');
var EC = protractor.ExpectedConditions;


var testParams = {
    schemaName: "product-unordered-related-tables-links",
    table_name: "accommodation",
    key: {
        name: "id",
        value: "2004",
        operator: "="
    },
    headers: [
        "booking (showing all 6 results)", // normal
        "schedule (showing all 2 results)", // has search
        "media (showing all 1 results)", // has row_markdown_pattern
        "association_table (showing all 1 results)", // association
        "accommodation_image (showing first 2 results)", // association with page_size
        "association_table_markdown (showing all 1 results)", // association with markdown
        "related_table_2 (showing all 1 results)", // related entity with path length 3
        "table_w_aggregates (showing all 2 results)" // related entity with aggregate columns
    ],
    tocHeaders: ["Main", "booking (6)", "schedule (2)", "media (1)", "association_table (1)", "accommodation_image (2+)", "association_table_markdown (1)", "related_table_2 (1)", "table_w_aggregates (2)"],
    related_table_name_with_page_size_annotation: "accommodation_image",
    related_table_name_with_link_in_table: "accommodation_image"
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
        expect(chaisePage.recordPage.getRelatedTableTitles()).toEqual(testParams.headers, "list of related table accordion headers is incorret");
    });

    it ("should show the related table names in the correct order in the Table of Contents", function () {
        expect(chaisePage.recordPage.getSidePanelTableTitles()).toEqual(testParams.tocHeaders, "list of related tables in toc is incorrect");
    });

    var related_table = {
        comment: "inbound related, no applink or row_markdown_pattern",
        schemaName: "product-unordered-related-tables-links",
        displayname: "booking",
        name: "booking",
        baseTable:"Accommodations",
        count: 6,
        canDelete: true,
        canEdit: true,
        viewMore: {
            displayname: "booking",
            filter: "Accommodations: Super 8 North Hollywood Motel"
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
            columnDisplayname: "accommodation_id",
            columnValue: "Super 8 North Hollywood Motel",
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
            filter: "Accommodations: Super 8 North Hollywood Motel"
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
            filter: "base table association related : Super 8 North Hollywood Motel"
        },
        rowValues: [
            ["Television"]
        ],
        rowViewPaths: [
            [{column: "id", value: "1"}]
        ],
        rowEditPaths: [ // in case of association, edit should naviagte to the association table
            "id_base=2004&id_related=1"
        ],
        count: 1,
        canEdit: true,
        add: {
            relatedDisplayname: "association_table",
            tableDisplayname: "related_table",
            totalCount: 4,
            existingCount: 1,
            disabledRows: ["1"],
            selectIndex: 2,
            rowValuesAfter: [
                ["Television"],
                ["Coffee Maker"]
            ]
        }
    };
    describe("for a pure and binary association,", function () {
        recordHelpers.testRelatedTable(association_table, pageReadyCondition);

        recordHelpers.testAddAssociationTable(association_table.add, false, pageReadyCondition);
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
    describe("for a pure and binary association with page_size, ", function () {
        recordHelpers.testRelatedTable(association_with_page_size, pageReadyCondition);

        it ("Opened modal by `Add` button should honor the page_size.", function () {
            var addRelatedRecordLink = chaisePage.recordPage.getAddRecordLink(association_with_page_size.displayname);
            chaisePage.clickButton(addRelatedRecordLink).then(function(){
                chaisePage.waitForElement(chaisePage.recordEditPage.getModalTitle());
                return chaisePage.recordEditPage.getModalTitle().getText();
            }).then(function (title) {
                expect(title).toBe("Choose file", "titlte missmatch.");

                browser.wait(function () {
                    return chaisePage.recordsetPage.getModalRows().count().then(function (ct) {
                        return (ct == 2);
                    });
                });
                return chaisePage.recordsetPage.getModalRows().count();
            }).then(function(ct){
                expect(ct).toBe(2, "association count missmatch for file domain table.");
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

    var path_related = {
        comment: "related with a path of length 3",
        schemaName: "product-unordered-related-tables-links",
        displayname: "related_table_2",
        name: "related_table_2",
        baseTable:"Accommodations",
        viewMore: {
            displayname: "related_table_2",
            filter: "base table association related: Super 8 North Hollywood Motel"
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
            filter: "fk_to_accommodation : Super 8 North Hollywood Motel"
        },
        rowValues: [
            ["1", "100", "100", "1", "1"],
            ["2", "101", "101", "1", "1"],
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
});
