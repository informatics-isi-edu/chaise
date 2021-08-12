var chaisePage = require('../../../utils/chaise.page.js');
var recordSetHelpers = require('../../../utils/recordset-helpers.js');
var fs = require('fs');
var testParams = {
    accommodation_tuple: {
        schemaName: "product-recordset",
        table_name: "accommodation",
        comment: "List of different types of accommodations",
        displayName: "Accommodations",
        title: "Accommodations",
        key: { name: "id", value: "2001", operator: "::gt::"},
        shortest_key_filter: "RID=",
        sortby: "no_of_rooms",
        file_names: ["Accommodations.csv", "accommodation.zip"],
        columns: [
            { title: "Name of Accommodation"},
            { title: "Website", comment: "A valid url of the accommodation"},
            { title: "User Rating"},
            { title: "Number of Rooms"},
            { title: "Summary"},
            { title: "Operational Since"},
            { title: "Is Luxurious"},
            { title: "json_col"},
            { title: "json_col_with_markdown"},
            { title: "no_of_beds", comment: "test all-outbound + waitfor for normal columns"},
            { title: "no_of_baths", comment: "wait_for normal columns on multiple aggregates"},
            { title: "Category", comment: "Type of accommodation ('Resort/Hotel/Motel')"},
            { title: "Type of Facilities", comment: "Type of facilities ('Luxury/Upscale/Basic')"},
            { title: "Image Count", comment: "Image Count"},
            { title: "Image Distinct Count", comment: "Image Distinct Count"},
            { title: "Min Image ID", comment: "Min Image ID"},
            { title: "summary of Image ID", comment: "Summary of Image ID"},
            { title: "color_rgb_hex_column"}
        ],
        data: [
            {
                id: 2003,
                no_of_rooms: '15',
                title: "NH Munich Resort",
                website: "http://www.nh-hotels.com/hotels/munich",
                rating: "3.2000",
                summary: "NH Hotels has six resorts in the city of Munich. Very close to Munich Main Train Station -- the train being one of the most interesting choices of transport for travelling around Germany -- is the four-star NH München Deutscher Kaiser Hotel. In addition to the excellent quality of accommodation that it offers, the hotel is located close to Marienplatz, the monumental central square in the city, the Frauenkirche church, Stachus (Karlsplatz) and the Viktualienmarkt. Other places of interest to explore in Munich are the English garden, the spectacular Nymphenburg Palace and the German Museum, a museum of science and technology very much in keeping with the industrial spirit of the city. Do not forget to visit Munich at the end of September and beginning of October, the time for its most famous international festival: Oktoberfest! Beer, sausages, baked knuckles and other gastronomic specialities await you in a festive atmosphere on the grasslands of Theresienwiese. Not to be missed! And with NH Hotels you can choose the hotels in Munich which best suit your travel plans, with free WiFi and the possibility to bring your pets with you.",
                opened_on: "1976-06-15 00:00:00",
                luxurious: "true",
                json_col: JSON.stringify({"name":"testing_json"},undefined,2),
                json_col_with_markdown: "Status is: “delivered”",
                no_of_beds: "beds: 1, id: 2003, has gym, thumbnail: NH Hotel, Munich, image id cnt: 1",
                no_of_baths: "baths: 1, id: 2003, images: 3001",
                category: "Resort",
                type_of_facilities: "Luxury",
                count_image_id: "1",
                count_distinct_image_id: "1",
                min_image_id: "3001",
                max_image_id: "rating: 3.2000, max: 3001, count: 1, category: Resort",
                color_rgb_hex_column: "#123456"
            },
            {
                id: 2002,
                no_of_rooms: '23',
                title: "Sherathon Hotel",
                website: "http://www.starwoodhotels.com/sheraton/index.html",
                rating: "4.3000",
                summary: "Sherathon Hotels is an international hotel company with more than 990 locations in 73 countries. The first Radisson Hotel was built in 1909 in Minneapolis, Minnesota, US. It is named after the 17th-century French explorer Pierre-Esprit Radisson.",
                opened_on: "2008-12-09 00:00:00",
                luxurious: "true",
                json_col: JSON.stringify(null,undefined,2),
                json_col_with_markdown: "Status is: “delivered”",
                no_of_beds: "beds: 1, id: 2002, has gym, image id cnt: 4",
                no_of_baths: "baths: 1, id: 2002, images: 3005, 3006, 3008, 30007",
                category: "Hotel",
                type_of_facilities: "Upscale",
                count_image_id: "4",
                count_distinct_image_id: "4",
                min_image_id: "3005",
                max_image_id: "rating: 4.3000, max: 30007, count: 4, category: Hotel",
                color_rgb_hex_column: "#323456"
            },
            {
                id: 2004,
                no_of_rooms: '35',
                title: "Super 8 North Hollywood Motel",
                website: "https://www.kayak.com/hotels/Super-8-North-Hollywood-c31809-h40498/2016-06-09/2016-06-10/2guests",
                summary: "Fair Hotel. Close to Universal Studios. Located near shopping areas with easy access to parking. Professional staff and clean rooms. Poorly-maintained rooms.",
                rating: "2.8000",
                opened_on: "2013-06-11 00:00:00",
                luxurious: "false",
                json_col: JSON.stringify({"age": 25,"name": "Testing"},undefined,2),
                json_col_with_markdown: "Status is: “Processing”",
                no_of_beds: "beds: 1, id: 2004, thumbnail: Motel thumbnail, image id cnt: 3",
                no_of_baths: "baths: 1, id: 2004, images: 3009, 3010, 3011",
                category: "Motel",
                type_of_facilities: "Basic",
                count_image_id: "3",
                count_distinct_image_id: "3",
                min_image_id: "3009",
                max_image_id: "rating: 2.8000, max: 3011, count: 3, category: Motel",
                color_rgb_hex_column: "#423456"
            },
            {
                id: 4004,
                no_of_rooms: '96',
                title: "Hilton Hotel",
                website: "",
                summary: "Great Hotel. We've got the best prices out of anyone. Stay here to make America great again. Located near shopping areas with easy access to parking. Professional staff and clean rooms. Poorly-maintained rooms.",
                rating: "4.2000",
                opened_on: "2013-06-11 00:00:00",
                luxurious: "true",
                json_col: "9876.3543",
                json_col_with_markdown: "Status is: “Processing”",
                no_of_beds: "beds: 1, id: 4004, has gym, image id cnt: 0",
                no_of_baths: "baths: 1, id: 4004",
                category: "Hotel",
                type_of_facilities: "Upscale",
                count_image_id: "0",
                count_distinct_image_id: "0",
                min_image_id: "",
                max_image_id: "",
                color_rgb_hex_column: "#523456"
            }
        ],
        sortedData:[
            {
                columnName: "Name of Accommodation",
                rawColumnName: "title",
                columnPosition: 1,
                page1:{
                    asc: ["NH Munich Resort", "Radisson Hotel", "Sherathon Hotel"],
                    desc: ["Super 8 North Hollywood Motel", "Sherathon Hotel", "Sherathon Hotel"]
                },
                page2:{
                    asc: ["Sherathon Hotel", "Super 8 North Hollywood Motel"],
                    desc: ["Radisson Hotel", "NH Munich Resort"]
                }
            },
            {
                columnName: "Number of Rooms",
                rawColumnName: "no_of_rooms",
                columnPosition: 4,
                page1:{
                    asc: ["15", "23", "23", ],
                    desc: ["46", "35", "23"]
                },
                page2:{
                    asc: ["35", "46"],
                    desc: ["23", "15"]
                }
            },
            {
                columnName: "Operational Since",
                rawColumnName: "opened_on",
                columnPosition: 6,
                page1:{
                    asc: ["1976-06-15 00:00:00", "2002-01-22 00:00:00", "2008-12-09 00:00:00"],
                    desc: ["2013-06-11 00:00:00", "2008-12-09 00:00:00", "2008-12-09 00:00:00"]
                },
                page2:{
                    asc: ["2008-12-09 00:00:00", "2013-06-11 00:00:00"],
                    desc: ["2002-01-22 00:00:00", "1976-06-15 00:00:00"]
                }
            },
            {
                columnName:"Category",
                rawColumnName: "F8V7Ebs7zt7towDneZvefw",
                columnPosition: 12,
                page1:{
                    asc: ["Hotel", "Hotel", "Hotel"],
                    desc: ["Resort", "Motel", "Hotel"]
                },
                page2:{
                    asc: ["Motel", "Resort"],
                    desc: ["Hotel", "Hotel"]
                }
            },
            {
                columnName:"Type of Facilities",
                rawColumnName: "hZ7Jzy0aC3Q3KQqz4DIXTw",
                columnPosition: 13,
                page1:{
                    asc: ["Basic", "Luxury", "Upscale"],
                    desc: ["Upscale", "Upscale", "Upscale"]
                },
                page2:{
                    asc: ["Upscale", "Upscale"],
                    desc: ["Luxury", "Basic"]
                }
            }
        ]
    },
    file_tuple: {
        table_name: "file",
        custom_page_size: 5,
        page_size: 10
    },
    tooltip: {
        exportDropdown: "Click to choose an export format.",
        permalink: "Click to copy the current url to clipboard.",
        actionCol: "Click on the action buttons to view, edit, or delete each record"
    },
    activeList: {
        schemaName: "active_list_schema",
        table_name: "main",
        sortby: "main_id",
        data: [
            [
                "main one", // self_link_rowname
                "current: main one(1234501, 1,234,501), id: 01, array: 1,234,521, 1,234,522, 1,234,523, 1,234,524, 1,234,525", // self_link_id
                "1,234,501", //normal_col_int_col
                "current cnt: 5 - 1,234,511, 1234511, cnt_i1: 5", //normal_col_int_col_2
                "outbound1 one", //outbound_entity_o1
                "current: outbound2 one(1234521, 1,234,521), self_link_rowname: 1,234,501", //outbound_entity_o2
                "1,234,511", //outbound_scalar_o1
                "current: 1,234,521, 1234521, max_i1: 1,234,525, array i1: inbound1 one(1234521, 1,234,521), inbound1 two(1234522, 1,234,522)", //outbound_scalar_o2
                "outbound1_outbound1 one", // all_outbound_entity_o1_o1
                "current: outbound2_outbound1 one(12345111, 12,345,111), array: 12345221| 12345222", // all_outbound_entity_o2_o1
                "12,345,111", // all_outbound_scalar_o1_o1
                "current: 12,345,111, 12345111, o1_o1_o1: outbound1_outbound1_outbound1 one, o2_o1: 12,345,111", //all_outbound_scalar_o2_o1
                "inbound1 one, inbound1 two", // array_d_entity_i1
                "current: inbound2 one(12345221, 12,345,221), cnt: 5", // array_d_entity_i2
                "1,234,521, 1,234,522, 1,234,523, 1,234,524, 1,234,525", // array_d_scalar_i1
                "current: 12,345,221, 12,345,222 - 12345221| 12345222, max: 12,345,225", // array_d_scalar_i2
                "5", //cnt_i1
                "current: 5, 5, cnt_i1: 5, array_i3: inbound3 one", //cnt_i2
                "5", //cnt_d_i1
                "current: 5, 5, cnt_i1: 5, cnt_i2: 5, array_i4: i01, i02, i03, i04, i05", //cnt_d_i2
                "1,234,521", //min_i1
                "current: 12,345,221, 12345221, 12,345,111", //min_i2
                "1,234,525", //max_i1
                "current: 12,345,225, 12345225", //max_i2
                "virtual col value is 12,345,225", //virtual column
            ],
            [
                "main two", "", "1,234,502",
                "", "", "", "", "", "", "",
                "", "", "", "", "", "", "0",
                "", "0", "", "", "", "", "",
                ""
            ]
        ]
    },
    system_columns: {
        table_name: "system-columns",
        compactConfig: ['RCB', 'RMT'],
        detailedConfig: true,
        entryConfig: ['RCB', 'RMB', 'RMT'],
        compactColumnsSystemColumnsTable: ['id', 'text', 'int', 'RCB', 'RMT'],
        detailedColumns: ['RID', 'id', 'text', 'int', 'RCB', 'RMB', 'RCT', 'RMT'],
        compactColumnsPersonTable: ['id', 'text', 'RCB', 'RMT'], // no int column because it's the foreign key link (would be redundent)
        entryColumns: ['id', 'text', 'int', 'RCB', 'RMB', 'RMT']
    }
};

describe('View recordset,', function() {

    var accommodationParams = testParams.accommodation_tuple,
        fileParams = testParams.file_tuple;


    if (!process.env.CI) {
        describe("For recordset with columns with waitfor, ", function () {
            var activeListParams = testParams.activeList;
            var activeListData = activeListParams.data;

            beforeAll(function () {
                browser.ignoreSynchronization=true;
                browser.get(browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + activeListParams.schemaName + ":" + activeListParams.table_name + "@sort(" + activeListParams.sortby + ")");

                chaisePage.recordsetPageReady();
                chaisePage.waitForAggregates();
            });

            it ("should not show the total count if hide_row_count is true.", function () {
                expect(chaisePage.recordsetPage.getTotalCount().getText()).toBe("Displaying\nall "+ activeListData.length + "\nrecords", "hide_row_count not honored");
            });

            it ("should show correct table rows.", function (done) {
                chaisePage.recordsetPage.getRows().then(function (rows) {
                    expect(rows.length).toBe(activeListData.length, "row length missmatch.");
                    rows.forEach(function (row, rowIndex) {
                        var expectedRow = activeListData[rowIndex];
                        chaisePage.recordsetPage.getRowCells(row).then(function (cells) {
                            expect(cells.length).toBe(expectedRow.length + 1, "cells length missmatch for row index=" + rowIndex);

                            var expectedCell
                            for (var cellIndex = 0; cellIndex < expectedRow.length; cellIndex++) {
                                expectedCell = expectedRow[cellIndex];
                                // the first cell is the action columns
                                expect(cells[cellIndex + 1].getText()).toBe(expectedCell, "data missmatch in row index=" + rowIndex + ", cell index=" + cellIndex);
                            }

                            if (rowIndex === rows.length - 1) {
                                done();
                            }

                        }).catch(chaisePage.catchTestError(done));
                    });
                }).catch(chaisePage.catchTestError(done));
            });

            it ("going to a page with no results, the loader for columns should hide.", function (done) {
                browser.ignoreSynchronization=true;
                browser.get(browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + activeListParams.schemaName + ":" + activeListParams.table_name + "/main_id=03");

                chaisePage.recordsetPageReady()
                chaisePage.waitForAggregates();
                done();
            })
        });
    }

    describe("For table " + accommodationParams.table_name + ",", function() {

        beforeAll(function () {
            var keys = [];
            keys.push(accommodationParams.key.name + accommodationParams.key.operator + accommodationParams.key.value);
            browser.ignoreSynchronization=true;
            browser.get(browser.params.url + "/recordset/#" + browser.params.catalogId + "/product-recordset:" + accommodationParams.table_name + "/" + keys.join("&") + "@sort(" + accommodationParams.sortby + ")");

            chaisePage.recordsetPageReady()
            chaisePage.waitForAggregates();
        });

        describe("Presentation ,", function() {

            if (!process.env.CI) {
                beforeAll(function() {
                    // delete files that may have been downloaded before
                    console.log("delete files");
                    recordSetHelpers.deleteDownloadedFiles(accommodationParams.file_names);
                });
            }

            var recEditUrl =  '';
            it("should have '" + accommodationParams.title +  "' as title", function() {
                var title = chaisePage.recordsetPage.getPageTitleElement();
                expect(title.getText()).toEqual(accommodationParams.title);
            });

            it ('should have the correct tooltip.', function () {
                expect(chaisePage.recordsetPage.getPageTitleTooltip()).toBe(accommodationParams.comment);
            });

            it ("should have the correct head title using the heuristics for recordset app", function (done) {
                browser.executeScript("return chaiseConfig;").then(function(chaiseConfig) {
                    // <table-name> | chaiseConfig.headTitle
                    expect(browser.getTitle()).toBe(accommodationParams.title + " | " + chaiseConfig.headTitle);

                    done();
                }).catch(function (err) {
                    console.log(err);
                    done.fail();
                });
            });

            it('should display the permalink button & a tooltip on hovering over it', function () {
                var permalink = chaisePage.recordsetPage.getPermalinkButton();
                expect(permalink.isDisplayed()).toBe(true, "The permalink button is not visible on the recordset app");
                browser.actions().mouseMove(permalink).perform();
                var tooltip = chaisePage.getTooltipDiv();
                chaisePage.waitForElement(tooltip).then(function () {
                    expect(tooltip.getText()).toBe(testParams.tooltip.permalink, "Incorrect tooltip on the Permalink button");
                    browser.actions().mouseMove(chaisePage.recordsetPage.getTotalCount()).perform();
                });
            });

            it("should autofocus on search box", function() {
                var searchBox = chaisePage.recordsetPage.getMainSearchInput();
                chaisePage.waitForElement(searchBox);
                expect(searchBox.getAttribute('id')).toEqual(browser.driver.switchTo().activeElement().getAttribute('id'));
            });

            it("should use annotated page size", function() {
                var EC = protractor.ExpectedConditions;
                var e = chaisePage.recordsetPage.getPageLimitSelector(15);
                browser.wait(EC.presenceOf(e), browser.params.defaultTimeout);
                expect(e.getAttribute("innerText")).toBe("15");
            });

            it("should show correct table rows", function() {
                chaisePage.recordsetPage.getRows().then(function(rows) {
                    expect(rows.length).toBe(4, "rows length missmatch.");
                    for (var i = 0; i < rows.length; i++) {
                        (function(index) {
                            rows[index].all(by.tagName("td")).then(function (cells) {
                                expect(cells.length).toBe(accommodationParams.columns.length + 1, "cells length missmatch for row=" + index);
                                expect(cells[1].getText()).toBe(accommodationParams.data[index].title, "title column missmatch for row=" + index);
                                expect(cells[2].element(by.tagName("a")).getAttribute("href")).toBe(accommodationParams.data[index].website, "website column link missmatch for row=" + index);
                                expect(cells[2].element(by.tagName("a")).getText()).toBe("Link to Website", "website column caption missmatch for row=" + index);
                                expect(cells[3].getText()).toBe(accommodationParams.data[index].rating, "rating column missmatch for row=" + index);
                                expect(cells[4].getText()).toBe(accommodationParams.data[index].no_of_rooms, "no_of_rooms column missmatch for row=" + index);
                                expect(cells[5].getText()).toContain(accommodationParams.data[index].summary, "summary column missmatch for row=" + index);
                                expect(cells[6].getText()).toBe(accommodationParams.data[index].opened_on, "opened_on column missmatch for row=" + index);
                                expect(cells[7].getText()).toBe(accommodationParams.data[index].luxurious, "luxurious column missmatch for row=" + index);
                                expect(cells[8].getText()).toBe(accommodationParams.data[index].json_col, "json_col column missmatch for row=" + index);
                                expect(cells[9].getText()).toBe(accommodationParams.data[index].json_col_with_markdown, "json_col_with_markdown column missmatch for row=" + index);
                                expect(cells[10].getText()).toBe(accommodationParams.data[index].no_of_beds, "no_of_beds column missmatch for row=" + index);
                                expect(cells[11].getText()).toBe(accommodationParams.data[index].no_of_baths, "no_of_baths column missmatch for row=" + index);
                                expect(cells[12].getText()).toBe(accommodationParams.data[index].category, "category column missmatch for row=" + index);
                                expect(cells[13].getText()).toBe(accommodationParams.data[index].type_of_facilities, "type of facilities column missmatch for row=" + index);
                                expect(cells[14].getText()).toBe(accommodationParams.data[index].count_image_id, "count_image_id column missmatch for row=" + index);
                                expect(cells[15].getText()).toBe(accommodationParams.data[index].count_distinct_image_id, "count_distinct_image_id column missmatch for row=" + index);
                                expect(cells[16].getText()).toBe(accommodationParams.data[index].min_image_id, "min_image_id column missmatch for row=" + index);
                                expect(cells[17].getText()).toBe(accommodationParams.data[index].max_image_id, "max_image_id column missmatch for row=" + index);
                            });
                        }(i))
                    }
                });
            });

            it("should have " + accommodationParams.columns.length + " columns", function() {
                chaisePage.recordsetPage.getColumnNames().then(function(columns) {
                    expect(columns.length).toBe(accommodationParams.columns.length);
                    for (var i = 0; i < columns.length; i++) {
                        expect(columns[i].getText()).toEqual(accommodationParams.columns[i].title);
                    }
                });
            });

            it("should display the Export dropdown button with proper tooltip.", function(done) {
                var exportDropdown = chaisePage.recordsetPage.getExportDropdown();
                expect(exportDropdown.isDisplayed()).toBe(true, "The export dropdown button is not visible on the recordset app");
                browser.actions().mouseMove(exportDropdown).perform();
                var tooltip = chaisePage.getTooltipDiv();
                chaisePage.waitForElement(tooltip).then(function () {
                    expect(tooltip.getText()).toBe(testParams.tooltip.exportDropdown, "Incorrect tooltip on the export dropdown button");
                    browser.actions().mouseMove(chaisePage.recordsetPage.getTotalCount()).perform();
                    done();
                }).catch(function (err) {
                    console.log(err);
                    done.fail();
                });
            });

            it("should have '2' options in the dropdown menu.", function (done) {
                chaisePage.recordsetPage.getExportDropdown().click().then(function () {
                    expect(chaisePage.recordsetPage.getExportOptions().count()).toBe(2, "incorrect number of export options");
                    // close the dropdown
                    return chaisePage.recordsetPage.getExportDropdown().click();
                }).then(function () {
                    done();
                }).catch(function (err) {
                    console.log(err);
                    done.fail();
                });
            });

            if (!process.env.CI) {
                it("should have 'CSV' as a download option and download the file.", function(done) {
                    chaisePage.recordsetPage.getExportDropdown().click().then(function () {
                        var csvOption = chaisePage.recordsetPage.getExportOption("Search results (CSV)");
                        expect(csvOption.getText()).toBe("Search results (CSV)");
                        return csvOption.click();
                    }).then(function () {
                        browser.wait(function() {
                            return fs.existsSync(process.env.PWD + "/test/e2e/Accommodations.csv");
                        }, browser.params.defaultTimeout).then(function () {
                            done();
                        }, function () {
                            expect(false).toBeTruthy("Accommodations.csv was not downloaded");
                        });
                    }).catch(function (err) {
                        console.log(err);
                        done.fail();
                    });
                });

                it("should have 'BDBag' as a download option and download the file.", function(done) {
                    chaisePage.recordsetPage.getExportDropdown().click().then(function () {
                        var bagOption = chaisePage.recordsetPage.getExportOption("BDBag");
                        expect(bagOption.getText()).toBe("BDBag");
                        return bagOption.click();
                    }).then(function () {
                        return chaisePage.waitForElement(chaisePage.recordsetPage.getExportModal());
                    }).then(function () {
                        return chaisePage.waitForElementInverse(chaisePage.recordsetPage.getExportModal());
                    }).then(function () {
                        return browser.wait(function() {
                            return fs.existsSync(process.env.PWD + "/test/e2e/accommodation.zip");
                        }, browser.params.defaultTimeout);
                    }).then(function () {
                        chaisePage.waitForElementInverse(element(by.css(".export-progress")));
                        done();
                    }).catch(function (err) {
                        done.fail(err);
                    });
                });
            }

            it("should show line under columns which have a comment and inspect the comment value too", function() {
                var columns = accommodationParams.columns.filter(function(c) {
                    return typeof c.comment == 'string';
                });
                chaisePage.recordsetPage.getColumnsWithUnderline().then(function(pageColumns) {
                    expect(pageColumns.length).toBe(columns.length);
                    var index = 0;
                    pageColumns.forEach(function(c) {
                        var comment = columns[index++].comment;
                        chaisePage.recordsetPage.getColumnComment(c).then(function(actualComment) {
                            var exists = actualComment ? true : undefined;
                            expect(exists).toBeDefined();

                            // Check comment is same
                            expect(actualComment).toBe(comment);
                        });
                    });
                });

                //Check tooltip of Action column
                var actionCol = chaisePage.recordsetPage.getActionHeaderSpan();
                chaisePage.recordsetPage.getColumnComment(actionCol).then(function(comment){
                    expect(comment).toBe(testParams.tooltip.actionCol);
                });
            });

            it("apply different searches, ", function(done) {
                var EC = protractor.ExpectedConditions;
                var e = chaisePage.recordsetPage.getPageLimitSelector(15);
                browser.wait(EC.presenceOf(e), browser.params.defaultTimeout);

                var searchBox = chaisePage.recordsetPage.getMainSearchInput(),
                searchSubmitButton = chaisePage.recordsetPage.getSearchSubmitButton(),
                clearSearchButton = chaisePage.recordsetPage.getSearchClearButton(),
                noResultsMessage = "No Results Found";

                searchBox.sendKeys('Super 8 North Hollywood Motel');
                searchSubmitButton.click().then(function() {
                    chaisePage.recordsetPage.waitForInverseMainSpinner();
                    expect(chaisePage.recordsetPage.getRows().count()).toBe(1, "search 01: row count missmatch");
                    expect(chaisePage.recordsetPage.getTotalCount().getText()).toBe("Displaying\nall 1\nof 1 matching results", "search 01: total count missmatch.");
                    // clear search
                    return clearSearchButton.click();
                }).then(function() {
                    chaisePage.recordsetPage.waitForInverseMainSpinner();
                    expect(chaisePage.recordsetPage.getRows().count()).toBe(4, "search 02: row count missmatch");
                    expect(chaisePage.recordsetPage.getTotalCount().getText()).toBe("Displaying\nall 4\nof 4 matching results", "search 02: total count missmatch.");

                    // apply conjunctive search words
                    searchBox.sendKeys('"Super 8" motel "North Hollywood"');
                    return searchSubmitButton.click();
                }).then(function() {
                    chaisePage.recordsetPage.waitForInverseMainSpinner();
                    expect(chaisePage.recordsetPage.getRows().count()).toBe(1, "search 03: row count missmatch");
                    expect(chaisePage.recordsetPage.getTotalCount().getText()).toBe("Displaying\nall 1\nof 1 matching results", "search 03: total count missmatch.");
                    // clear search
                    return clearSearchButton.click();
                }).then(function() {
                    chaisePage.recordsetPage.waitForInverseMainSpinner();

                    // search has been reset
                    searchBox.sendKeys("asdfghjkl");
                    return searchSubmitButton.click();
                }).then(function() {

                    chaisePage.recordsetPage.waitForInverseMainSpinner();
                    expect(chaisePage.recordsetPage.getRows().count()).toBe(0, "search 04: row count missmatch");
                    expect(chaisePage.recordsetPage.getTotalCount().getText()).toBe("Displaying\n0 matching results", "search 04: total count missmatch.");
                    expect(chaisePage.recordsetPage.getNoResultsRow().getText()).toBe(noResultsMessage, "search 04: no result message missmatch.");

                    // clearing the search here resets the page for the next test case
                    clearSearchButton.click();
                }).then(function () {
                    chaisePage.recordsetPage.waitForInverseMainSpinner();
                    done();
                }).catch(function(err) {
                    done.fail(err);
                });

            });

            it("JSON Column value should be searchable", function(){
                var searchBox = chaisePage.recordsetPage.getMainSearchInput(),
                    searchSubmitButton = chaisePage.recordsetPage.getSearchSubmitButton();

                // search for a row that is not the first one after sorting
                searchBox.sendKeys('9876.3543');
                searchSubmitButton.click().then(function() {
                    chaisePage.recordsetPage.waitForInverseMainSpinner();
                    return chaisePage.recordsetPage.getRows();
                }).then(function(rows) {
                    expect(rows.length).toBe(1);

                    // clear search in next it case
                });
            });

            it("check the link of the view details after searching", function () {
                var dataRow = browser.params.entities[accommodationParams.schemaName][accommodationParams.table_name].find(function (entity) {
                    return entity.id == accommodationParams.data[3].id;
                });

                var filter = accommodationParams.shortest_key_filter + dataRow.RID;
                var viewUrl = '/record/#' + browser.params.catalogId + "/" + accommodationParams.schemaName + ":" + accommodationParams.table_name + "/" + filter;

                chaisePage.recordsetPage.getRows().then(function (rows) {
                    // get first row view details button
                    expect(rows[0].element(by.css('.view-action-button')).getAttribute("href")).toContain(viewUrl, "View button url is incorrect after filtering set");

                    // clear search
                    return chaisePage.recordsetPage.getSearchClearButton().click();
                });
            });

            // view link here should be different from the `it` case above
            it("action columns should show view button that redirects to the record page", function() {
                var dataRow = browser.params.entities[accommodationParams.schemaName][accommodationParams.table_name].find(function (entity) {
                    return entity.id == accommodationParams.data[0].id;
                });
                var filter = accommodationParams.shortest_key_filter + dataRow.RID;

                browser.wait(function() {
                    return chaisePage.recordsetPage.getViewActionButtons().count().then(function(ct) {
                        return (ct == 4);
                    });
                }, browser.params.defaultTimeout);

                chaisePage.recordsetPage.getViewActionButtons().then(function(viewButtons) {
                    return viewButtons[0].click();
                }).then(function() {
                    var result = '/record/#' + browser.params.catalogId + "/" + accommodationParams.schemaName + ":" + accommodationParams.table_name + "/" + filter;
                    chaisePage.waitForUrl(result, browser.params.defaultTimeout).finally(function() {
                        expect(browser.driver.getCurrentUrl()).toContain(result);
                        browser.navigate().back();
                    });
                });
            });

            it("action columns should show edit button that redirects to the recordedit page", function() {
                var dataRow = browser.params.entities[accommodationParams.schemaName][accommodationParams.table_name].find(function (entity) {
                    return entity.id == accommodationParams.data[0].id;
                });
                var filter = accommodationParams.shortest_key_filter + dataRow.RID;
                var allWindows;

                browser.wait(function() {
                    return chaisePage.recordsetPage.getEditActionButtons().count().then(function(ct) {
                        return (ct == 4);
                    });
                }, browser.params.defaultTimeout);

                chaisePage.recordsetPage.getEditActionButtons().then(function(editButtons) {
                    return editButtons[0].click();
                }).then(function() {
                    return browser.getAllWindowHandles();
                }).then(function(handles) {
                    allWindows = handles;
                    return browser.switchTo().window(allWindows[1]);
                }).then(function() {
                    var result = '/recordedit/#' + browser.params.catalogId + "/" + accommodationParams.schemaName + ":" + accommodationParams.table_name + "/" + filter;
                    browser.driver.getCurrentUrl().then(function(url) {
                        // Store this for use in later spec.
                        recEditUrl = url;
                    });
                    expect(browser.driver.getCurrentUrl()).toContain(result);
                    browser.close();
                    browser.switchTo().window(allWindows[0]);
                });
            });

            xit('should show a modal if user tries to delete (via action column) a record that has been modified by someone else (412 error)', function() {
                var EC = protractor.ExpectedConditions, allWindows, config;
                // Edit a record in a new tab in order to change the ETag
                recEditUrl = recEditUrl.replace('id=2003', 'id=4004');
                recEditUrl = recEditUrl.slice(0, recEditUrl.indexOf('?invalidate'));

                browser.executeScript('window.open(arguments[0]);', recEditUrl).then(function() {
                    return browser.getAllWindowHandles();
                }).then(function(handles) {
                    allWindows = handles;
                    return browser.switchTo().window(allWindows[1]);
                }).then(function() {
                    // In order to simulate someone else modifying a record (in order to
                    // trigger a 412), we need to set RecEdit's window.opener to null so
                    // that RecordSet won't think that this RecEdit page was opened by the same user
                    // from the RecordSet page.
                    return browser.executeScript('window.opener = null');
                }).then(function () {
                    return chaisePage.waitForElement(element(by.id("submit-record-button")));
                }).then(function() {
                    // - Change a small thing. Submit.
                    var input = chaisePage.recordEditPage.getInputById(0, 'Summary');
                    input.clear();
                    input.sendKeys('as;dkfa;sljk als;dkj f;alsdjf a;');
                    return chaisePage.recordEditPage.getSubmitRecordButton().click();
                }).then(function() {
                    // Wait for RecordEdit to redirect to Record to make sure the submission went through.
                    return chaisePage.waitForUrl('/record/', browser.params.defaultTimeout);
                }).then(function() {
                    expect(browser.driver.getCurrentUrl()).toContain('/record/');
                    // - Go back to initial RecordSet page
                    browser.close();
                    return browser.switchTo().window(allWindows[0]);
                }).then(function() {
                    return chaisePage.recordsetPage.getDeleteActionButtons().get(3).click();
                }).then(function () {
                    var modalTitle = chaisePage.recordPage.getConfirmDeleteTitle();
                    browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);
                    // expect modal to open
                    return modalTitle.getText();
                }).then(function(text) {
                    expect(text).toBe("Confirm Delete");
                    return chaisePage.recordPage.getConfirmDeleteButton().click();
                }).then(function() {
                    // Expect another modal to appear to tell user that this record cannot be deleted
                    // and user should check the updated UI for latest row data.
                    chaisePage.waitForElement(element(by.id('confirm-btn')));
                    return element(by.id('confirm-btn')).click();
                }).then(function() {
                    chaisePage.recordsetPage.waitForInverseMainSpinner();
                    var rows = chaisePage.recordsetPage.getRows();
                    var changedCell = rows.get(3).all(by.css('td')).get(4);
                    expect(changedCell.getText()).toBe('as;dkfa;sljk als;dkj f;alsdjf a;');
                }).catch(function(error) {
                    console.dir(error);
                    expect(error).not.toBeDefined();
                });
            }).pend("412 support has been dropped from ermestjs.");

            it("action columns should show delete button that deletes record", function() {
                var deleteButton;
                var EC = protractor.ExpectedConditions;

                browser.wait(function() {
                    return chaisePage.recordsetPage.getDeleteActionButtons().count().then(function(ct) {
                        return (ct == 4);
                    });
                }, browser.params.defaultTimeout);
                chaisePage.recordsetPage.getDeleteActionButtons().then(function(deleteButtons) {
                    deleteButton = deleteButtons[3];
                    return deleteButton.click();
                }).then(function() {
                    var confirmButton = chaisePage.recordsetPage.getConfirmDeleteButton();
                    browser.wait(EC.visibilityOf(confirmButton), browser.params.defaultTimeout);

                    return confirmButton.click();
                }).then(function() {
                    browser.wait(function () {
                        return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                            return (ct==3)
                        });
                    });

                    return chaisePage.recordsetPage.getRows().count();
                }).then(function(ct) {
                    expect(ct).toBe(3);
                });
            });

            if (!process.env.CI) {
                afterAll(function() {
                    // delete files that have been downloaded during tests
                    console.log("delete files");
                    recordSetHelpers.deleteDownloadedFiles(accommodationParams.file_names);
                });
            }

        });

        describe("testing sorting and paging features, ", function () {
            var rowCount = chaisePage.recordsetPage.getTotalCount();
            var recordsOnPage1 = accommodationParams.sortedData[0].page1.asc.length;
            var recordsOnPage2 = accommodationParams.sortedData[0].page2.asc.length;
            var totalRecords = recordsOnPage1 + recordsOnPage2;

            beforeAll(function () {
                browser.get(browser.params.url + "/recordset/#" + browser.params.catalogId + "/product-recordset:" + accommodationParams.table_name + "?limit=3");
                var EC = protractor.ExpectedConditions;
                chaisePage.recordsetPage.waitForInverseMainSpinner();
                browser.wait(EC.presenceOf(chaisePage.recordsetPage.getRows().get(2)), browser.params.defaultTimeout);
            });

            for (var j = 0; j < accommodationParams.sortedData.length; j++) {
                (function (k) {
                    it("should sort " + accommodationParams.sortedData[k].columnName + " column in ascending order.", function (done) {
                        // Check the presence of initial sort button
                        expect(chaisePage.recordsetPage.getColumnSortButton(accommodationParams.sortedData[k].rawColumnName).isDisplayed()).toBe(true, accommodationParams.sortedData[k].columnName + " column doesn't contain the initial sort button.");

                        // Click on sort button
                        chaisePage.recordsetPage.getColumnSortButton(accommodationParams.sortedData[k].rawColumnName).click().then(function () {
                            chaisePage.waitForTextInElement(rowCount, "Displayingfirst " + recordsOnPage1 + "of " + totalRecords + " records");
                            chaisePage.recordsetPage.waitForInverseMainSpinner();

                            //Check the presence of descending sort button
                            expect(chaisePage.recordsetPage.getColumnSortDescButton(accommodationParams.sortedData[k].rawColumnName).isDisplayed()).toBe(true,  accommodationParams.sortedData[k].columnName + " column doesn't contain the descending sort button.");

                            // Check if the url has @sort by column name
                            chaisePage.waitForTextInUrl('@sort(' + accommodationParams.sortedData[k].rawColumnName + ',RID)', "Url doesn't contain @sort(column name) for " + accommodationParams.sortedData[k].rawColumnName + " column on Page 1 for ascending order.");

                            return chaisePage.recordsetPage.getRows();

                        }).then(function (rows) {
                            // Check if values of the sorted column on this page(first page) are in ascending order.
                            for (var i = 0; i < recordsOnPage1; i++) {
                                (function (index1) {
                                    rows[index1].all(by.tagName("td")).then(function (cells) {
                                        expect(cells[accommodationParams.sortedData[k].columnPosition].getText()).toBe(accommodationParams.sortedData[k].page1.asc[index1], accommodationParams.sortedData[k].rawColumnName + " column value missmatch for row = " + index1 + " in ascending order on Page 1.");
                                    });
                                }(i))
                            }

                            // Go to the next page
                            return chaisePage.recordsetPage.getNextButton().click();

                        }).then(function () {
                            chaisePage.waitForTextInElement(rowCount, "Displayinglast " + recordsOnPage2 + "of " + totalRecords + " records");
                            chaisePage.recordsetPage.waitForInverseMainSpinner();

                            // Check if the url has @sort by column name
                            chaisePage.waitForTextInUrl('@sort(' + accommodationParams.sortedData[k].rawColumnName + ',RID)', "Url doesn't contain @sort(column name) for " + accommodationParams.sortedData[k].rawColumnName + " column on Page 2 for ascending order.");

                            return chaisePage.recordsetPage.getRows();

                        }).then(function (rows) {
                            // Check if values of the sorted column on second page are in ascending order
                            for (var i = 0; i < recordsOnPage2; i++) {
                                (function (index2) {
                                    rows[index2].all(by.tagName("td")).then(function (cells) {
                                        expect(cells[accommodationParams.sortedData[k].columnPosition].getText()).toBe(accommodationParams.sortedData[k].page2.asc[index2], accommodationParams.sortedData[k].rawColumnName + " column value missmatch for row = " + index2 + " in ascending order on Page 2.");
                                    });
                                }(i))
                            }

                            // Go to the previous page
                            return chaisePage.recordsetPage.getPreviousButton().click();

                        }).then(function () {
                            chaisePage.waitForTextInElement(rowCount, "Displayingfirst " + recordsOnPage1 + "of " + totalRecords + " records");
                            chaisePage.recordsetPage.waitForInverseMainSpinner();

                            // Sanity check on the previous page
                            chaisePage.waitForTextInUrl('@sort(' + accommodationParams.sortedData[k].rawColumnName + ',RID)', "Url doesn't contain @sort(column name) for " + accommodationParams.sortedData[k].rawColumnName + " column on Page 1 for ascending order.");
                            done();

                        }).catch(function (err) {
                            console.log("Error in the promise chain: ", err);
                            done.fail(err);
                        });

                    });

                    it("should sort " + accommodationParams.sortedData[k].columnName + " column in descending order.", function (done) {
                        // Check the presence of descending sort button
                        expect(chaisePage.recordsetPage.getColumnSortDescButton(accommodationParams.sortedData[k].rawColumnName).isDisplayed()).toBe(true, accommodationParams.sortedData[k].columnName + " column doesn't contain the descending sort button.");

                        // Click on sort button to sort in descending order
                        chaisePage.recordsetPage.getColumnSortDescButton(accommodationParams.sortedData[k].rawColumnName).click().then(function () {
                            chaisePage.waitForTextInElement(rowCount, "Displayingfirst " + recordsOnPage1 + "of " + totalRecords + " records");
                            chaisePage.recordsetPage.waitForInverseMainSpinner();

                            // Check the presence of ascending sort button
                            expect(chaisePage.recordsetPage.getColumnSortAscButton(accommodationParams.sortedData[k].rawColumnName).isDisplayed()).toBe(true, accommodationParams.sortedData[k].columnName + " column doesn't contain the ascending sort button.");

                            // Check if the url has @sort by column name
                            chaisePage.waitForTextInUrl('@sort(' + accommodationParams.sortedData[k].rawColumnName + '::desc::,RID)', "Url doesn't contain @sort(column name) for " + accommodationParams.sortedData[k].rawColumnName + " column on Page 1 for descending order.");

                            return chaisePage.recordsetPage.getRows();

                        }).then(function (rows) {
                            // Check if values of the sorted column on first page are in descending order
                            for (var i = 0; i < recordsOnPage1; i++) {
                                (function (index3) {
                                    rows[index3].all(by.tagName("td")).then(function (cells) {
                                        expect(cells[accommodationParams.sortedData[k].columnPosition].getText()).toBe(accommodationParams.sortedData[k].page1.desc[index3], accommodationParams.sortedData[k].rawColumnName + " column value missmatch for row = " + index3 + " in descending order on Page 1");
                                    });
                                }(i))
                            }

                            // Go to the next page
                            return chaisePage.recordsetPage.getNextButton().click();

                        }).then(function () {
                            chaisePage.waitForTextInElement(rowCount, "Displayinglast " + recordsOnPage2 + "of " + totalRecords + " records");
                            chaisePage.recordsetPage.waitForInverseMainSpinner();

                            // Check if the url has @sort by column name
                            chaisePage.waitForTextInUrl('@sort(' + accommodationParams.sortedData[k].rawColumnName + '::desc::,RID)', "Url doesn't contain @sort(column name) for " + accommodationParams.sortedData[k].rawColumnName + " column on Page 2 for descending order.");

                            return chaisePage.recordsetPage.getRows();

                        }).then(function (rows) {
                            // Check if values of the sorted column on second page are in descending order
                            for (var i = 0; i < recordsOnPage2; i++) {
                                (function (index4) {
                                    rows[index4].all(by.tagName("td")).then(function (cells) {
                                        expect(cells[accommodationParams.sortedData[k].columnPosition].getText()).toBe(accommodationParams.sortedData[k].page2.desc[index4], accommodationParams.sortedData[k].rawColumnName + " column value missmatch for row = " + index4 + " in descending order on Page 2.");
                                    });
                                }(i))
                            }

                            // Go to the previous page
                            return chaisePage.recordsetPage.getPreviousButton().click();

                        }).then(function () {
                            chaisePage.waitForTextInElement(rowCount, "Displayingfirst " + recordsOnPage1 + "of " + totalRecords + " records");
                            chaisePage.recordsetPage.waitForInverseMainSpinner();

                            // Sanity check on the previous page
                            chaisePage.waitForTextInUrl('@sort(' + accommodationParams.sortedData[k].rawColumnName + '::desc::,RID)', "Url doesn't contain @sort(column name) for " + accommodationParams.sortedData[k].rawColumnName + " column on Page 1 for descending order.");
                            done();

                        }).catch(function (err) {
                            console.log("Error in the promise chain: ", err);
                            done.fail(err);
                        });
                    });
                }(j))
            }

        });

    });

    describe("For table " + fileParams.table_name + ',', function() {
        var EC = protractor.ExpectedConditions;

        beforeAll(function () {
            browser.ignoreSynchronization = true;
            browser.get(browser.params.url + "/recordset/#" + browser.params.catalogId + "/product-recordset:" + fileParams.table_name);
        });

        it("should load the table with " + fileParams.custom_page_size + " rows of data based on the page size annotation.", function(done) {
            // Verify page count and on first page
            var e = chaisePage.recordsetPage.getPageLimitSelector(fileParams.custom_page_size);

            browser.wait(EC.presenceOf(e), browser.params.defaultTimeout).then(function() {
                browser.wait(function () {
                    return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                        return (ct==fileParams.custom_page_size)
                    });
                });

                return chaisePage.recordsetPage.getRows().count();
            }).then(function(ct) {
                expect(ct).toBe(fileParams.custom_page_size);
                done();
            }).catch(function (err) {
                done.fail(err);
            })
        });

        it("should display the proper row count and total row count.", function () {
            chaisePage.recordsetPage.getTotalCount().getText().then(function(text) {
                expect(text).toBe("Displaying\nfirst 5\nof 14 records");
            });
        });

        it("should have " + fileParams.page_size + " rows after paging to the second page, back to the first, and then changing page size to " + fileParams.page_size + ".", function(done) {
            var previousBtn = chaisePage.recordsetPage.getPreviousButton(),
                pageLimitBtn = chaisePage.recordsetPage.getPageLimitDropdown();
            // page to the next page then page back to the first page so the @before modifier is applied
            chaisePage.recordsetPage.getNextButton().click().then(function() {
                // wait for it to be on the second page
                browser.wait(EC.elementToBeClickable(previousBtn), browser.params.defaultTimeout);

                return previousBtn.click();
            }).then(function() {
                //wait for it to be on the first page again
                browser.wait(EC.not(EC.elementToBeClickable(previousBtn)), browser.params.defaultTimeout);

                //make sure the button is clickable
                browser.wait(EC.elementToBeClickable(pageLimitBtn), browser.params.defaultTimeout);

                return pageLimitBtn.click();
            }).then(function() {
                var dropdownOption = chaisePage.recordsetPage.getPageLimitSelector(fileParams.page_size);
                browser.wait(EC.elementToBeClickable(dropdownOption), browser.params.defaultTimeout);
                // increase the page limit
                return dropdownOption.click();
            }).then(function() {
                browser.wait(function() {
                    return chaisePage.recordsetPage.getRows().count().then(function(ct) {
                        return (ct == 10);
                    });
                }, browser.params.defaultTimeout);

                // verify more records are now shown
                return chaisePage.recordsetPage.getRows().count();
            }).then(function(ct) {
                expect(ct).toBe(fileParams.page_size);
                done();
            }).catch(function (err) {
                done.fail(err);
            })
        });

        it("should have 14 rows and paging buttons disabled when changing the page size to 25.", function(done) {
            var nextBtn = chaisePage.recordsetPage.getNextButton(),
                prevBtn = chaisePage.recordsetPage.getPreviousButton();

            chaisePage.recordsetPage.getPageLimitDropdown().click().then(function() {

                return chaisePage.recordsetPage.getPageLimitSelector(25).click();
            }).then(function() {
                browser.wait(EC.not(EC.elementToBeClickable(nextBtn)), browser.params.defaultTimeout);

                expect(nextBtn.isEnabled()).toBeFalsy();
                expect(prevBtn.isEnabled()).toBeFalsy();
                return chaisePage.recordsetPage.getRows().count();
            }).then(function(ct) {
                expect(ct).toBe(14);
                done();
            }).catch(function (err) {
                done.fail(err);
            })
        });
    });

    describe("For window ID and page ID", function() {
        var windowId, pageId;

        beforeEach(function () {
            var keys = [];
            keys.push(accommodationParams.key.name + accommodationParams.key.operator + accommodationParams.key.value);
            browser.ignoreSynchronization=true;
            browser.get(browser.params.url + "/recordset/#" + browser.params.catalogId + "/product-recordset:" + accommodationParams.table_name + "/" + keys.join("&") + "@sort(" + accommodationParams.sortby + ")");

            chaisePage.recordsetPageReady().then(function () {
                return chaisePage.getWindowName();
            }).then(function (name) {
                windowId = name;
                return chaisePage.getPageId();
            }).then(function (id) {
                pageId = id;
            });
        });

        it("clicking view action should change current window with the same window ID and a new page ID.", function () {
            var dataRow = browser.params.entities[accommodationParams.schemaName][accommodationParams.table_name].find(function (entity) {
                return entity.id == accommodationParams.data[0].id;
            });
            var filter = accommodationParams.shortest_key_filter + dataRow.RID;

            chaisePage.recordsetPage.getViewActionButtons().then(function(viewButtons) {
                return viewButtons[0].click();
            }).then(function() {
                return chaisePage.recordPageReady();
            }).finally(function() {
                expect(chaisePage.getWindowName()).toBe(windowId);
                // pageId should change when the window changes page
                expect(chaisePage.getPageId()).not.toBe(pageId);
                browser.navigate().back();
                chaisePage.recordsetPage.waitForInverseMainSpinner();
                expect(chaisePage.getWindowName()).toBe(windowId);
                // pageId should change when navigating back
                expect(chaisePage.getPageId()).not.toBe(pageId);
            });
        });

        it("clicking edit action should open a new window with a new window ID and a new page ID.", function () {
            var dataRow = browser.params.entities[accommodationParams.schemaName][accommodationParams.table_name].find(function (entity) {
                return entity.id == accommodationParams.data[0].id;
            });
            var filter = accommodationParams.shortest_key_filter + dataRow.RID;
            var allWindows;

            chaisePage.recordsetPage.getEditActionButtons().then(function(editButtons) {
                return editButtons[0].click();
            }).then(function() {
                return browser.getAllWindowHandles();
            }).then(function(handles) {
                allWindows = handles;
                return browser.switchTo().window(allWindows[1]);
            }).then(function() {
                return chaisePage.recordeditPageReady();
            }).finally(function() {
                expect(chaisePage.getWindowName()).not.toBe(windowId);
                // pageId should change when a new window is opened
                expect(chaisePage.getPageId()).not.toBe(pageId);
                browser.close();
                return browser.switchTo().window(allWindows[0]);
            }).then(function () {
                expect(chaisePage.getWindowName()).toBe(windowId);
                // pageId should not have changed when a new window was opened
                expect(chaisePage.getPageId()).toBe(pageId);
            });
        });
    });

    describe("For chaise config properties", function () {
        var EC = protractor.ExpectedConditions;

        it('should load chaise-config.js with confirmDelete=true && defaults catalog and table set', function() {
            var chaiseConfig, keys = [];
            keys.push(accommodationParams.key.name + accommodationParams.key.operator + accommodationParams.key.value);
            var url = browser.params.url + "/recordset/#" + browser.params.catalogId + "/product-recordset:" + accommodationParams.table_name + "/" + keys.join("&") + "@sort(" + accommodationParams.sortby + ")";
            browser.ignoreSynchronization=true;
            browser.get(url);

            chaisePage.waitForElement(element(by.id('page-title')), browser.params.defaultTimeout).then(function() {
                return browser.executeScript('return chaiseConfig');
            }).then(function(config) {
                chaiseConfig = config;
                expect(chaiseConfig.confirmDelete).toBeTruthy();
                // use "deFAuLtCaTAlog" since we are grabbing the property directly from chaise config. The application will use the right value
                expect(chaiseConfig.deFAuLtCaTAlog).toBe(1);
                expect(chaiseConfig.defaultTables['1'].schema).toBe("isa");
                expect(chaiseConfig.defaultTables['1'].table).toBe("dataset");
            }).catch(function(error) {
                console.log('ERROR:', error);
                // Fail the test
                expect('There was an error in this promise chain.').toBe('See the error msg for more info.');
            });
        });

        if (!process.env.CI) {
            describe("For when no catalog or schema:table is specified,", function() {
                var baseUrl;

                beforeAll(function () {
                    browser.ignoreSynchronization = true;
                });


                it("should use the default catalog and schema:table defined in chaise config if no catalog or schema:table is present in the uri.", function() {
                    browser.get(process.env.CHAISE_BASE_URL + "/recordset");

                    chaisePage.waitForElement(chaisePage.recordsetPage.getPageLimitDropdown(), browser.params.defaultTimeout).then(function() {
                        return chaisePage.recordsetPage.getPageTitleElement().getText();
                    }).then(function (title) {
                        expect(title).toBe("Dataset");
                    });
                });

                it("should use the default schema:table defined in chaise config if no schema:table is present in the uri.", function() {
                    browser.get(process.env.CHAISE_BASE_URL + "/recordset/#1");

                    chaisePage.waitForElement(chaisePage.recordsetPage.getPageLimitDropdown(), browser.params.defaultTimeout).then(function() {
                        return chaisePage.recordsetPage.getPageTitleElement().getText();
                    }).then(function (title) {
                        expect(title).toBe("Dataset");
                    });
                });

                it("should throw a malformed URI error when no default schema:table is set for a catalog.", function() {
                    browser.get(process.env.CHAISE_BASE_URL + "/recordset/#" + browser.params.catalogId);

                    var modalTitle = chaisePage.recordEditPage.getModalTitle();

                    chaisePage.waitForElement(modalTitle, browser.params.defaultTimeout).then(function() {
                        return modalTitle.getText();
                    }).then(function (title) {
                        expect(title).toBe("Invalid URI");
                    });
                });
            });

            describe("should load chaise-config.js with system columns heuristic properties", function () {
                var systemColumnsParams = testParams.system_columns;
                beforeAll(function () {
                    browser.ignoreSynchronization=true;
                    var url = browser.params.url + "/recordset/#" + browser.params.catalogId + "/system-columns-heuristic:" + systemColumnsParams.table_name;
                    browser.get(url); // won't fetch the change because hash didn't change, changes the url
                    browser.refresh(); // hash didn't change, so page won't actually fetch unless reloaded

                    chaisePage.recordsetPageReady();
                });

                it('should have values defined in config with odd cases', function() {
                    browser.executeScript('return chaiseConfig').then(function(config) {
                        // testing the following based on case defined in chaise-config.js
                        // the application will digest this properly and test that below by inspecting the UI
                        expect(config.systemcolumnsdisplaycompact).toEqual(systemColumnsParams.compactConfig);
                        expect(config.SystemColumnsDisplayDetailed).toBeTruthy();
                        expect(config.systemColumnsDisplayENTRY).toEqual(systemColumnsParams.entryConfig);
                    }).catch(function(error) {
                        console.log('ERROR:', error);
                        // Fail the test
                        expect('There was an error in this promise chain.').toBe('See the error msg for more info.');
                    });
                });

                it("with systemColumnsDisplayCompact: ['RCB', 'RMT'], should have proper columns.", function () {
                    chaisePage.recordsetPage.getColumnNames().then(function(columns) {
                        expect(columns.length).toBe(systemColumnsParams.compactColumnsSystemColumnsTable.length);
                        for (var i = 0; i < columns.length; i++) {
                            expect(columns[i].getText()).toEqual(systemColumnsParams.compactColumnsSystemColumnsTable[i]);
                        }
                    });
                });

                it("systemColumnsDisplayDetailed: true, should have proper columns after clicking a row.", function () {
                    chaisePage.recordsetPage.getViewActionButtons().then(function (buttons) {
                        expect(buttons.length).toBe(1);
                        return buttons[0].click();
                    }).then(function () {
                        return chaisePage.recordPageReady();
                    }).then(function () {
                        browser.wait(function () {
                            return chaisePage.recordPage.getColumns().count().then(function(ct) {
                                return ct == systemColumnsParams.detailedColumns.length;
                            });
                        });

                        return chaisePage.recordPage.getColumns();
                    }).then(function (columns) {
                        expect(columns.length).toBe(systemColumnsParams.detailedColumns.length);
                        for (var i = 0; i < columns.length; i++) {
                            expect(columns[i].getText()).toEqual(systemColumnsParams.detailedColumns[i]);
                        }
                    });
                });

                it("on record page, systemColumnsDisplayCompact should also be honored for related tables.", function () {
                    chaisePage.recordPage.getRelatedTableColumnNamesByTable("person").then(function (columns) {
                        expect(columns.length).toBe(systemColumnsParams.compactColumnsPersonTable.length);
                        for (var i = 0; i < columns.length; i++) {
                            expect(columns[i].getText()).toEqual(systemColumnsParams.compactColumnsPersonTable[i]);
                        }
                    });
                });

                it("on recordedit page with systemColumnsDisplayEntry: ['RCB', 'RMB', 'RMT'], should have proper columns", function () {
                    // click create
                    chaisePage.recordPage.getCreateRecordButton().click().then(function () {
                        // test columns length

                        chaisePage.recordeditPageReady();
                        return chaisePage.recordEditPage.getAllColumnCaptions();
                    }).then(function(pageColumns) {
                        expect(pageColumns.length).toBe(systemColumnsParams.entryColumns.length, "number of visible columns in entry is not what is expected.");

                        // test each column
                        for (var i=0; i<pageColumns.length; i++) {
                            expect(pageColumns[i].getAttribute('innerHTML')).toEqual(systemColumnsParams.entryColumns[i], "column with index i=" + i + " is not correct");
                        }
                    });
                });
            });
        }
    });
});
