var chaisePage = require('../../../utils/chaise.page.js');
var recordHelpers = require('../../../utils/record-helpers.js');
var recordSetHelpers = require('../../../utils/recordset-helpers.js');
var moment = require('moment');

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
    tables_order: ["accommodation_image (showing first 2 results)", "media (no results found)"],
    file_names: ["Accommodations.csv", "accommodation.zip"],
    related_table_name_with_page_size_annotation: "accommodation_image",
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
        { title: "Name of Accommodation", value: "Sherathon Hotel", type: "text"},
        { title: "Website", value: "<p><a href=\"http://www.starwoodhotels.com/sheraton/index.html\">Link to Website</a></p>\n", type: "text", comment: "A valid url of the accommodation", match:"html" },
        { title: "Category", value: "Hotel", type: "text", comment: "Type of accommodation ('Resort/Hotel/Motel')", presentation: { type:"url", template: "{{{chaise_url}}}/record/#{{catalog_id}}/product-record:category/", table_name: "category", key_value: [{column: "id", value: "10003"}]} },
        { title: "booking", value:'<p><strong class="vocab">2</strong> <strong class="vocab">350.0000</strong> <strong class="vocab">2016-04-18 00:00:00</strong> <strong class="vocab">4</strong> <strong class="vocab">200.0000</strong> <strong class="vocab">2016-05-31 00:00:00</strong></p>\n', type: "inline" },
        { title: "User Rating", value: "4.3000", type: "float4", annotations: { "tag:misd.isi.edu,2015:display": { markdown_name: "<strong>User Rating</strong>"}} },
        { title: "Summary", value: "Sherathon Hotels is an international hotel company with more than 990 locations in 73 countries. The first Radisson Hotel was built in 1909 in Minneapolis, Minnesota, US. It is named after the 17th-century French explorer Pierre-Esprit Radisson.", type: "longtext"},
        { title: "Description", type: "markdown", match: "html", value: "<p><strong>CARING. SHARING. DARING.</strong><br>\nRadisson<sup>®</sup> is synonymous with outstanding levels of service and comfort delivered with utmost style. And today, we deliver even more to make sure we maintain our position at the forefront of the hospitality industry now and in the future.<br>\nOur hotels are service driven, responsible, socially and locally connected and demonstrate a modern friendly attitude in everything we do. Our aim is to deliver our outstanding <code>Yes I Can!</code> <sup>SM</sup> service, comfort and style where you need us.</p>\n<p><strong>THE RADISSON<sup>®</sup> WAY</strong> Always positive, always smiling and always professional, Radisson people set Radisson apart. Every member of the team has a dedication to <code>Yes I Can!</code> <sup>SM</sup> hospitality – a passion for ensuring the total wellbeing and satisfaction of each individual guest. Imaginative, understanding and truly empathetic to the needs of the modern traveler, they are people on a special mission to deliver exceptional Extra Thoughtful Care.</p>\n"},
        { title: "Number of Rooms", value: "23", type: "int2"},
        { title: "Cover Image", value: "3005", type: "int2", presentation: { type: "url", template: "{{{chaise_url}}}/record/#{{catalog_id}}/product-record:file/", table_name: "file", key_value: [{column: "id", value: "3005"}]} },
        { title: "Thumbnail", value: null, type: "int4"},
        { title: "Operational Since", value: "2008-12-09 00:00:00", type: "timestamptz" },
        { title: "Is Luxurious", value: "true", type: "boolean" },
        { title: "accommodation_collections", value: "Sherathon Hotel", comment: "collections", presentation: { type: "inline", template: "{{{chaise_url}}}/record/#{{catalog_id}}/product-record:accommodation_collection/", table_name: "accommodation_collection", key_value: [{column: "id", value: "2000"}]} },
        { title: "table_w_aggregates", value: "3", comment: "has aggregates", presentation: { type: "inline", template: "{{{chaise_url}}}/record/#{{catalog_id}}/product-record:table_w_aggregates/", table_name: "table_w_aggregates", key_value: [{column: "id", value: "3"}]} },
        { title: "# Id", comment: "Count of Id", value: "1"},
        { title: "# Id", comment: "Count Distinct of Id", value: "1"},
        { title: "Min Name of accommodation_collection", comment: "Minimum of title", value: "Sherathon Hotel"},
        { title: "Max Name of accommodation_collection", comment: "maximum of title", value: "Sherathon Hotel"},
        { title: "json_col", value:'<pre>'+JSON.stringify(null,undefined,2)+'</pre>', match:"html"},
        { title: "json_col_with_markdown", value: "<p>Status is: “delivered”</p>\n", match:"html"},
        { title: "accommodation_image_assoc", comment: "Accommodation Image", value: "3005", presentation: { type: "inline", template: "{{{chaise_url}}}/record/#{{catalog_id}}/product-record:file/", table_name: "file", key_value: [{column: "id", value: "3005"}]} }
      ],
    no_related_data: {
        key: {
            name: "id",
            value: "4004",
            operator: "="
        },
        tables_order: ["accommodation_image (no results found)", "media (no results found)"]
    },
    multipleData: {
        title : "Multiple Records Found"
    },
    sidePanelTest: {
      schemaName: "product-record",
      tableName: "accommodation_collection",
      id: "2003",
      tocCount: 8,
      tableToShow: 'Categories_5',
      sidePanelTableOrder:[ 'Main', 'Categories_collection\n (5)',  'media\n \n (1)', 'Categories_collection_2\n (5)',  'Categories_3\n (5)',  'Categories_4\n (5)',  'Categories_5\n (5)',  'Categories_6\n (5)'],
      panelHeading: "Contents"
    },
    citationParams: {
        numListElements: 2,
        citation: "Sherathon Hotel, " + moment().format("YYYY") + ", 2002, http://www.starwoodhotels.com/sheraton/index.html"
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
          isTableMode: true,
          viewMore: {
              name: "accommodation_collection",
              displayname: "accommodation_collections",
              filter: "Accommodations (Cover Image): 3005"
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
          canCreate: true,
          isInline: true,
          isTableMode: true,
          viewMore: {
              name: "table_w_aggregates",
              displayname: "table_w_aggregates",
              filter: "Accommodations: Sherathon Hotel"
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
              filter: "accommodation_image_assoc : Sherathon Hotel"
          },
          rowValues: [
              ["3005","Four Points Sherathon 1","http://images.trvl-media.com/hotels/1000000/30000/28200/28110/28110_190_z.jpg","image/jpeg","0","2016-01-18 00:00:00","","",""]
          ],
          rowViewPaths: [[{
              column: "id",
              value: "3005"
          }]],
          rowEditPaths: [ // in case of association, edit should naviagte to the association table
              "accommodation_id=2002&image_id=3005"
          ],
      }
  ]
};


describe('View existing record,', function() {

    describe("For table " + testParams.table_name + ",", function() {

        beforeAll(function() {
            var keys = [];
            keys.push(testParams.key.name + testParams.key.operator + testParams.key.value);
            browser.ignoreSynchronization=true;
            var url = browser.params.url + "/record/#" + browser.params.catalogId + "/product-record:" + testParams.table_name + "/" + keys.join("&");
            browser.get(url);
            var start = (new Date()).getTime();
            chaisePage.waitForElement(element(by.id('tblRecord'))).then(function() {
                console.log((new Date()).getTime() - start);
            });
        });

        it('should load document title defined in chaise-config.js and have deleteRecord=true', function() {
            browser.manage().logs().get('browser').then(function(browserLog) {
                browser.executeScript("return chaiseConfig;").then(function(chaiseConfig) {
                    expect(chaiseConfig.deleteRecord).toBe(true);
                    if (chaiseConfig.headTitle) {
                        browser.getTitle().then(function(title) {
                            expect(title).toEqual(chaiseConfig.headTitle);
                        });
                    }
                });
            });

        });

        describe("Presentation ,", function() {
            if (!process.env.TRAVIS) {
                beforeAll(function() {
                    // delete files that may have been downloaded before
                    console.log("delete files");
                    recordSetHelpers.deleteDownloadedFiles(testParams.file_names);
                });
            }

            recordHelpers.testPresentation(testParams);

            if (!process.env.TRAVIS) {
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
            browser.ignoreSynchronization=true;
            var url = browser.params.url + "/record/#" + browser.params.catalogId + "/product-record:" + testParams.table_name + "/" + keys.join("&");
            browser.get(url);
            chaisePage.waitForElement(element(by.id('tblRecord')));
            chaisePage.waitForElementInverse(element(by.id('rt-loading')));
        });

        it("should show all of the related tables in the correct order.", function() {

            browser.wait(function() {
                return chaisePage.recordPage.getRelatedTablesWithPanel().count().then(function(ct) {
                    return (ct == testParams.no_related_data.tables_order.length);
                });
            }, browser.params.defaultTimeout);
            var showAllRTButton = chaisePage.recordPage.getShowAllRelatedEntitiesButton();

            chaisePage.recordPage.getRelatedTablesWithPanelandHeading().count().then(function(count) {
                expect(count).toBe(testParams.no_related_data.tables_order.length, "Number of related tables is not correct");

                return chaisePage.recordPage.getRelatedTableTitles();
            }).then(function(headings) {
                expect(headings).toEqual(testParams.no_related_data.tables_order, "Related tables in the wrong order or the name is wrong");

                expect(showAllRTButton.getText()).toBe("Hide Empty Related Records", "Sow all Related tables button has wrong text");
                return showAllRTButton.click();
            }).then(function() {
                expect(chaisePage.recordPage.getRelatedTablesWithPanelandHeading().count()).toBe(0, "Not all the related tables were hidden");
                expect(chaisePage.recordPage.getRelatedTablesWithPanelandHeading().count()).not.toBe(testParams.no_related_data.tables_order.length, "The full set of related tables were not properly hidden");
            })
        });
    });

    describe("For multiple records fetched for particular filters", function() {

        beforeAll(function() {
            var url = browser.params.url + "/record/#" + browser.params.catalogId + "/product-record:" + testParams.table_name +  "/luxurious=true";
            browser.get(url);
            chaisePage.waitForElement(element(by.css('.modal-dialog ')));
        });

        it('A error modal window should appear with multiple records found error with correct title', function(){
            var modalTitle = chaisePage.recordPage.getErrorModalTitle();
            expect(modalTitle).toBe(testParams.multipleData.title, "The title of multiple record error pop is not correct");

        });

        it('On click of OK button the page should redirect to recordset page', function(){
            chaisePage.recordPage.getErrorModalOkButton().then(function(btn){
                return btn.click();
            }).then (function (){
                return browser.driver.getCurrentUrl();
            }).then (function(currentUrl) {
                expect(currentUrl).toContain("recordset", "The redirection from record page to recordset in case of multiple records failed");
            }).catch( function(err) {
                console.log(err);
            });
        });
    });

    describe("For side panel table of contents in Record App", function() {

        beforeAll(function() {
            var url = browser.params.url + "/record/#" + browser.params.catalogId + "/" + testParams.sidePanelTest.schemaName + ":" + testParams.sidePanelTest.tableName +  "/id=" + testParams.sidePanelTest.id;
            browser.get(url);
            recSidePanelCat_5 = chaisePage.recordPage.getSidePanelItemById(5);
            fiddlerBtn = chaisePage.recordPage.getSidePanelFiddler();
            chaisePage.waitForElement(fiddlerBtn);
        });

        it('Table of contents should be displayed by default', function(){
            var recordSidePan = chaisePage.recordPage.getSidePanel();
            expect(recordSidePan.isDisplayed()).toBeTruthy("Side Panel is not visible when page loads initially.");
        });

        it('On click of Related table name in TOC, page should move to the contents and open the table details', function(done){
            var rtTableHeading = chaisePage.recordPage.getRelatedTableHeading(testParams.sidePanelTest.tableToShow);

            recSidePanelCat_5.click().then(function(className) {
              // related table should be visible
                expect(rtTableHeading.isDisplayed()).toBeTruthy("Category_5 heading is not visible.");
                return rtTableHeading.getAttribute("class");
            }).then (function(className) {
                expect(className).toContain("panel-open", "Related table panel is not open when clicked through TOC.");
                done();
            }).catch( function(err) {
                console.log(err);
                done.fail();
            });
        });

        it('Record count along with heading should match for the panel and related table content should be in correct order', function(done){
            chaisePage.recordPage.getSidePanelTableTitles().then(function(tableNames){
              for (var i=0; i<tableNames.length; i++){
                tableNames[i] = tableNames[i].replace(/ +/g, " ");
              }
                expect(tableNames.length).toEqual(testParams.sidePanelTest.tocCount, "Count mismatch for number of related tables in the side panel");
                expect(tableNames).toEqual(testParams.sidePanelTest.sidePanelTableOrder,"Order is not maintained for related tables in the side panel");
                return chaisePage.recordPage.getSidePanelHeading();
            }).then(function(sidePanelHeading){
                expect(sidePanelHeading).toBe(testParams.sidePanelTest.panelHeading, "Side Panel heading did not match.");
                done();
            }).catch( function(err) {
                console.log(err);
                done.fail();
            });
        });

        it('Side panel should hide/show by clicking pull button', function(done){
            var recPan =  chaisePage.recordPage.getSidePanel();

            fiddlerBtn.getAttribute("class").then(function(classNameRight) {
                expect(classNameRight).toContain('glyphicon glyphicon-triangle-right', 'Side Pan Pull button is not pointing in the right direction');
                expect(recPan.getAttribute("class")).toContain('open-panel', 'Side Panel is not visible when fiddler is poining in right direction');
                return fiddlerBtn.click();
            }).then(function(){
                expect(fiddlerBtn.getAttribute("class")).toContain("glyphicon glyphicon-triangle-left", "Side Pan Pull button is not pointing in the left direction.");
                expect(recPan.getAttribute("class")).toContain('close-panel', 'Side Panel is not hidden when fiddler is poining in left direction');
                done();
            }).catch( function(err) {
                console.log(err);
                done.fail();
            });
        });

    });

});
