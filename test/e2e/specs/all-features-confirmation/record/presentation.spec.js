var chaisePage = require('../../../utils/chaise.page.js');
var recordHelpers = require('../../../utils/record-helpers.js');
var recordSetHelpers = require('../../../utils/recordset-helpers.js');
var moment = require('moment');
var EC = protractor.ExpectedConditions;

var testParams = {
    table_name: "accommodation",
    key: {
        name: "id",
        value: "2002",
        operator: "="
    },
    title: "Sherathon Hotel",
    subTitle: "Accommodations",
    tableComment: "List of different types of accommodations",
    inlineTableWithCommentName: "booking",
    inlineTableComment: "booking inline related table comment",
    tocHeaders: [
        "Summary", "accommodation_collections (1)", "table_w_aggregates (1)", "accommodation_image_assoc (1)", "table_w_invalid_row_markdown_pattern (1)", "accommodation_image (2+)"
    ],
    tables_order: ["accommodation_image", "media"],
    file_names: [
        "Accommodations.csv",
        "accommodation_" + chaisePage.getEntityRow("product-record", "accommodation", [{column: "id",value: "2002"}]).RID + ".zip",
        "accommodation_"+chaisePage.getEntityRow("product-record", "accommodation", [{column: "id",value: "2002"}]).RID+".bib"
    ],
    related_table_name_with_page_size_annotation: "accommodation_image",
    inline_none_test: {
      index: 4,
      displayname: 'booking'
    },
    page_size: 2,
    related_tables: [
        {
            title: "accommodation_image",
            displayname: "accommodation_image",
            columns: [ "id", "filename", "uri", "content_type", "bytes", "timestamp", "image_width", "image_height", "preview" ],
            data: [
                { id: 3005, filename: "Four Points Sherathon 1", uri: "http://images.trvl-media.com/hotels/1000000/30000/28200/28110/28110_190_z.jpg", content_type: "image/jpeg", bytes: 0, timestamp: "2016-01-18T00:00:00-08:00", image_width: null, image_height: null, preview: null },
                { id: 3006, filename: "Four Points Sherathon 2", uri: "http://images.trvl-media.com/hotels/1000000/30000/28200/28110/28110_190_z.jpg", content_type: "image/jpeg", bytes: 0, timestamp: "2016-06-05T00:00:00-07:00", image_width: null, image_height: null, preview: null }
            ]
        },
        {
            title: "media",
            displayname: "<strong>media</strong>",
            columns: [ "id" ],
            data: []
        }
    ],
    columns: [
        { title: "Id", value: "2002", type: "serial4"},
        { title: "Name of Accommodation", value: "Sherathon Hotel, accommodation_inbound3 one| accommodation_inbound3 three| accommodation_inbound3 five", type: "text"},
        { title: "Website", value: "<p><a href=\"http://www.starwoodhotels.com/sheraton/index.html\" class=\"external-link-icon\">Link to Website</a></p>\n", type: "text", comment: "A valid url of the accommodation", match:"html" },
        { title: "Category", value: "Hotel", type: "text", comment: "Type of accommodation ('Resort/Hotel/Motel')", presentation: { type:"url", template: "{{{chaise_url}}}/record/#{{catalog_id}}/product-record:category/", table_name: "category", key_value: [{column: "id", value: "10003"}]} },
        { title: "booking", value:'<p><strong class="vocab">2</strong> <strong class="vocab">350.0000</strong> <strong class="vocab">2016-04-18 00:00:00</strong> <strong class="vocab">4</strong> <strong class="vocab">200.0000</strong> <strong class="vocab">2016-05-31 00:00:00</strong></p>\n', type: "inline" },
        { title: "User Rating", value: "4.3000", type: "float4", markdown_title: "<strong>User Rating</strong>" },
        { title: "Summary", value: "Sherathon Hotels is an international hotel company with more than 990 locations in 73 countries. The first Radisson Hotel was built in 1909 in Minneapolis, Minnesota, US. It is named after the 17th-century French explorer Pierre-Esprit Radisson.", type: "longtext"},
        { title: "Description", type: "markdown", match: "html", value: "<p><strong>CARING. SHARING. DARING.</strong><br>\nRadisson<sup>®</sup> is synonymous with outstanding levels of service and comfort delivered with utmost style. And today, we deliver even more to make sure we maintain our position at the forefront of the hospitality industry now and in the future.<br>\nOur hotels are service driven, responsible, socially and locally connected and demonstrate a modern friendly attitude in everything we do. Our aim is to deliver our outstanding <code>Yes I Can!</code> <sup>SM</sup> service, comfort and style where you need us.</p>\n<p><strong>THE RADISSON<sup>®</sup> WAY</strong> Always positive, always smiling and always professional, Radisson people set Radisson apart. Every member of the team has a dedication to <code>Yes I Can!</code> <sup>SM</sup> hospitality – a passion for ensuring the total wellbeing and satisfaction of each individual guest. Imaginative, understanding and truly empathetic to the needs of the modern traveler, they are people on a special mission to deliver exceptional Extra Thoughtful Care.</p>\n"},
        { title: "Number of Rooms", value: "23", type: "int2"},
        { title: "Cover Image", value: "3005", type: "int2", presentation: { type: "url", template: "{{{chaise_url}}}/record/#{{catalog_id}}/product-record:file/", table_name: "file", key_value: [{column: "id", value: "3005"}]} },
        { title: "Thumbnail", value: null, type: "int4"},
        { title: "Operational Since", value: "2008-12-09 00:00:00", type: "timestamptz" },
        { title: "Is Luxurious", value: "true", type: "boolean" },
        { title: "accommodation_collections", value: "<p>Sherathon Hotel, accommodation_outbound1_outbound2 one, max: Sherathon Hotel</p>", comment: "collections", type: "inline" },
        { title: "table_w_aggregates", value: "3", comment: "has aggregates", presentation: { type: "inline", template: "{{{chaise_url}}}/record/#{{catalog_id}}/product-record:table_w_aggregates/", table_name: "table_w_aggregates", key_value: [{column: "id", value: "3"}]} },
        { title: "# thumbnail collection", comment: "Count of thumbnail collection", value: "1", markdown_title: "# thumbnail collection"},
        { title: "# distinct thumbnail collection", comment: "Count distinct of thumbnail collection", value: "1", markdown_title: "# distinct thumbnail collection"},
        { title: "agg column with waitfor entityset and all-outbound", comment: "Minimum of title", value: "Sherathon Hotel, accommodation_outbound1_outbound4 one, accommodation_inbound2 one| accommodation_inbound2 three| accommodation_inbound2 five", markdown_title: "agg column with waitfor entityset and all-outbound"},
        { title: "Max Name of accommodation_collection", comment: "maximum of title", value: "Sherathon Hotel", markdown_title: "Max Name of accommodation_collection"},
        { title: "json_col", value:'<pre>'+JSON.stringify(null,undefined,2)+'</pre>', match:"html"},
        { title: "json_col_with_markdown", value: "<p>Status is: “delivered”</p>\n", match:"html"},
        { title: "accommodation_image_assoc", comment: "Accommodation Image", value: "3005", presentation: { type: "inline", template: "{{{chaise_url}}}/record/#{{catalog_id}}/product-record:file/", table_name: "file", key_value: [{column: "id", value: "3005"}]} },
        { title: "table_w_invalid_row_markdown_pattern"},
        { title: "virtual column wait_for all-outbound", "value": "virtual value of 2002 with title Sherathon Hotel", markdown_title: "virtual column wait_for all-outbound"},
        { title: "virtual column wait_for agg", "value": "virtual Sherathon Hotel", markdown_title: "virtual column wait_for agg"},
        { title: "virtual column wait_for entity set", "value": "Sherathon Hotel", markdown_title: "virtual column wait_for entity set"},
        { title: "color_rgb_hex_column", value: '<p><span class="chaise-color-preview" style="background-color:#323456"> </span> #323456</p>\n', match: "html"}
    ],
    no_related_data: {
        key: {
            name: "id",
            value: "4004",
            operator: "="
        },
        tables_order: ["accommodation_image", "media"]
    },
    sidePanelTest: {
      schemaName: "product-record",
      tableName: "accommodation_collection",
      id: "2003",
      tocCount: 8,
      tableToShow: 'Categories_5',
      sidePanelTableOrder:[ 'Summary', 'Categories_collection (5)',  'media (1)', 'Categories_collection_2 (5)',  'Categories_3 (5)',  'Categories_4 (5)',  'Categories_5 (5)',  'Categories_6 (5)']
    },
    sharePopupParams: {
        permalink: browser.params.origin+"/id/"+browser.params.catalogId+"/"+chaisePage.getEntityRow("product-record", "accommodation", [{column: "id",value: "2002"}]).RID,
        // the table has history-capture: true
        hasVersionedLink: true,
        verifyVersionedLink: true,
        citation: "accommodation_inbound1 one, accommodation_inbound1 three, accommodation_inbound1 five(3) Sherathon Hotel, accommodation_outbound1_outbound3 one http://www.starwoodhotels.com/sheraton/index.html (" + moment().format("YYYY") + ").",
        bibtextFile: "accommodation_"+chaisePage.getEntityRow("product-record", "accommodation", [{column: "id",value: "2002"}]).RID+".bib",
        title: "Share and Cite"
    },
    inline_columns: [
      {
          title: "a related entity with a path of length 3",
          name: "accommodation_collection",
          schemaName: "product-record",
          displayname: "accommodation_collections",
          count: 1,
          canEdit: true,
          canCreate: false,
          isInline: true,
          viewMore: {
              name: "accommodation_collection",
              displayname: "accommodation_collections",
              filter: "Accommodations\nSherathon Hotel"
          },
          rowValues: [
              ["2000", "Sherathon Hotel"]
          ],
          rowViewPaths: [[{
              column: "id",
              value: "2000"
          }]]
      },
      {
          title: "a related entity with aggregate columns",
          name: "table_w_aggregates",
          schemaName: "product-record",
          displayname: "table_w_aggregates",
          count: 1,
          canEdit: true,
          canCreate: false, // it has filter in source, so create is disabled
          isInline: true,
          viewMore: {
              name: "table_w_aggregates",
              displayname: "table_w_aggregates",
              filter: "Accommodations\nSherathon Hotel"
          },
          rowValues: [
              ["3", "102", "102", "1", "1"]
          ],
          rowViewPaths: [[{
              column: "id",
              value: "3"
          }]]
      },
      {
          title: "a related entity with association between accomodation and image",
          name: "accommodation_image_assoc",
          schemaName: "product-record",
          displayname: "accommodation_image_assoc",
          isAssociation: true,
          relatedName: "file",
          relatedDisplayname: "file",
          count: 1,
          canEdit: true,
          canCreate: true,
          // canDelete: true, NOTE: was canUnlink
          isInline: true,
          viewMore: {
              name: "file",
              displayname: "file",
              filter: "accommodation_image_assoc\nSherathon Hotel"
          },
          rowValues: [
              ["3005","Four Points Sherathon 1","http://images.trvl-media.com/hotels/1000000/30000/28200/28110/28110_190_z.jpg","image/jpeg","0","2016-01-18 00:00:00","","",""]
          ],
          rowViewPaths: [[{
              column: "id",
              value: "3005"
          }]]
      },
      {
          title: "a related entity with invalid row markdown pattern",
          name: "table_w_invalid_row_markdown_pattern",
          schemaName: "product-record",
          displayname: "table_w_invalid_row_markdown_pattern",
          isInline: true,
          isTableMode: true,
          viewMore: {
              name: "table_w_invalid_row_markdown_pattern",
              displayname: "table_w_invalid_row_markdown_pattern",
              filter: "Accommodations\nSherathon Hotel"
          },
          rowValues: [
              ["two"]
          ],
          rowViewPaths: [[{
              column: "id",
              value: "2002"
          }]]
      }
  ]
};


describe('View existing record,', function() {

    describe("For table " + testParams.table_name + ",", function() {

        beforeAll(function() {
            var keys = [];
            keys.push(testParams.key.name + testParams.key.operator + testParams.key.value);
            var url = browser.params.url + "/record/#" + browser.params.catalogId + "/product-record:" + testParams.table_name + "/" + keys.join("&");
            chaisePage.navigate(url);
            chaisePage.waitForElement(element(by.css('.record-main-section-table')));
        });

        it('should load document title defined in chaise-config.js and have deleteRecord=true, resolverImplicitCatalog=2, and shareCiteAcls defined', function() {
            browser.manage().logs().get('browser').then(function(browserLog) {
                browser.executeScript("return chaiseConfig;").then(function(chaiseConfig) {
                    expect(chaiseConfig.deleteRecord).toBe(true);

                    expect(chaiseConfig.resolverImplicitCatalog).toBe(2);

                    expect(chaiseConfig.shareCiteAcls).toBeDefined();
                    // both defined in chiase-config
                    expect(chaiseConfig.shareCiteAcls.show).toEqual(["*"]);
                    expect(chaiseConfig.shareCiteAcls.enable).toEqual(["*"]);
                });
            });

        });

        describe("Presentation ,", function() {
            if (!process.env.CI) {
                beforeAll(function() {
                    // delete files that may have been downloaded before
                    console.log("delete files");
                    recordSetHelpers.deleteDownloadedFiles(testParams.file_names);
                });
            }

            recordHelpers.testPresentation(testParams);

            if (!process.env.CI) {
                afterAll(function() {
                    // delete files that have been downloaded during tests
                    console.log("delete files");
                    recordSetHelpers.deleteDownloadedFiles(testParams.file_names);
                });
            }
        });

    });

    describe("For a record with all of it's related tables as empty", function() {

        beforeAll(function() {
            var keys = [];
            keys.push(testParams.no_related_data.key.name + testParams.no_related_data.key.operator + testParams.no_related_data.key.value);
            var url = browser.params.url + "/record/#" + browser.params.catalogId + "/product-record:" + testParams.table_name + "/" + keys.join("&");
            chaisePage.navigate(url)
            chaisePage.recordPageReady();
        });

        it("should show all of the related tables in the correct order.", function() {

            browser.wait(function() {
                return chaisePage.recordPage.getRelatedTables().count().then(function(ct) {
                    return (ct == testParams.no_related_data.tables_order.length);
                });
            }, browser.params.defaultTimeout);
            var showAllRTButton = chaisePage.recordPage.getShowAllRelatedEntitiesButton();

            chaisePage.recordPage.getRelatedTables().count().then(function(count) {
                expect(count).toBe(testParams.no_related_data.tables_order.length, "Number of related tables is not correct");

                return chaisePage.recordPage.getRelatedTableTitles();
            }).then(function(headings) {
                expect(headings).toEqual(testParams.no_related_data.tables_order, "Related tables in the wrong order or the name is wrong");

                expect(showAllRTButton.getText()).toBe("Hide empty sections", "Sow all Related tables button has wrong text");
                return showAllRTButton.click();
            }).then(function() {
                expect(chaisePage.recordPage.getRelatedTables().count()).toBe(0, "Not all the related tables were hidden");
                expect(chaisePage.recordPage.getRelatedTables().count()).not.toBe(testParams.no_related_data.tables_order.length, "The full set of related tables were not properly hidden");
            })
        });
    });

    describe("For side panel table of contents in Record App", function() {

        beforeAll(function() {
            var url = browser.params.url + "/record/#" + browser.params.catalogId + "/" + testParams.sidePanelTest.schemaName + ":" + testParams.sidePanelTest.tableName +  "/id=" + testParams.sidePanelTest.id;
            chaisePage.navigate(url);
            recSidePanelCat_5 = chaisePage.recordPage.getSidePanelItemById(5);
            hideTocBtn = chaisePage.recordPage.getHideTocBtn();
            chaisePage.waitForElement(hideTocBtn);
        });

        it('Table of contents should be displayed by default', function(){
            var recordSidePan = chaisePage.recordPage.getSidePanel();
            expect(recordSidePan.isDisplayed()).toBeTruthy("Side Panel is not visible when page loads initially.");
        });

        it('On click of Related table name in TOC, page should move to the contents and open the table details', function(done){
            var rtTableHeading = chaisePage.recordPage.getRelatedTableAccordion(testParams.sidePanelTest.tableToShow).element(by.css('.accordion-collapse'));

            browser.wait(EC.elementToBeClickable(recSidePanelCat_5), browser.params.defaultTimeout);
            recSidePanelCat_5.click().then(function(className) {
              // related table should be visible
                expect(rtTableHeading.isDisplayed()).toBeTruthy("Category_5 heading is not visible.");
                return rtTableHeading.getAttribute("class");
            }).then (function(className) {
                expect(className).toContain("show", "Related table panel is not open when clicked through TOC.");
                done();
            }).catch( function(err) {
                console.log(err);
                done.fail();
            });
        });

        it('Record count along with heading should match for the panel and related table content should be in correct order', function(done){
            chaisePage.recordPage.getSidePanelTableTitles().then(function(tableNames){
                // for (var i=0; i<tableNames.length; i++){
                //     tableNames[i] = tableNames[i].replace(/ +/g, " ");
                // }

                expect(tableNames.length).toEqual(testParams.sidePanelTest.tocCount, "Count mismatch for number of related tables in the side panel");
                tableNames.forEach(function (tableName, idx) {
                    tableName.getText().then(function (name) {
                        expect(name.replace(/ +/g, " ")).toEqual(testParams.sidePanelTest.sidePanelTableOrder[idx], "Order is not maintained for related tables in the side panel");
                    }); 
                })
                
                done();
            }).catch( function(err) {
                console.log(err);
                done.fail();
            });
        });

        it('Side panel should hide/show by clicking pull button', function(done){
            var recPan =  chaisePage.recordPage.getSidePanel();

            expect(hideTocBtn.element(by.className("chaise-icon")).getAttribute("class")).toContain('chaise-sidebar-close', 'Wrong icon for hide toc button');
            expect(recPan.getAttribute("class")).toContain('open-panel', 'Side Panel is NOT visible when it should be');

            hideTocBtn.click().then(function(){
                var showTocBtn = chaisePage.recordPage.getShowTocBtn();
                expect(showTocBtn.element(by.className("chaise-icon")).getAttribute("class")).toContain("chaise-sidebar-open", "Wrong icon for show toc button");
                expect(recPan.getAttribute("class")).toContain('close-panel', 'Side Panel is visible when it should NOT be');
                done();
            }).catch( function(err) {
                console.log(err);
                done.fail();
            });
        });

    });

});
