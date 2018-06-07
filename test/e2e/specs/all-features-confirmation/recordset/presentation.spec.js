var chaisePage = require('../../../utils/chaise.page.js');;
var testParams = {
    accommodation_tuple: {
        schemaName: "product-recordset",
        table_name: "accommodation",
        comment: "List of different types of accommodations",
        displayName: "Accommodations",
        title: "Accommodations",
        key: { name: "id", value: "2001", operator: "::gt::"},
        sortby: "no_of_rooms",
        columns: [
            { title: "Name of Accommodation", value: "Sherathon Hotel", type: "text"},
            { title: "Website", value: "<p class=\"ng-scope\"><a href=\"http://www.starwoodhotels.com/sheraton/index.html\">Link to Website</a></p>", type: "text", comment: "A valid url of the accommodation"},
            { title: "User Rating", value: "4.3000", type: "float4"},
            { title: "Number of Rooms", value: "23", type: "int4"},
            { title: "Summary", value: "Sherathon Hotels is an international hotel company with more than 990 locations in 73 countries. The first Radisson Hotel was built in 1909 in Minneapolis, Minnesota, US. It is named after the 17th-century French explorer Pierre-Esprit Radisson.", type: "longtext"},
            { title: "Operational Since", value: "2008-12-09 00:00:00", type: "timestamptz" },
            { title: "Is Luxurious", value: "true", type: "boolean" },
            { title: "json_col", value:JSON.stringify({"name":"testing JSON"},undefined,2), type: "json" },
            { title: "json_col_with_markdown", value: "Status is: delivered"},
            { title: "Category", value: "Hotel", comment: "Type of accommodation ('Resort/Hotel/Motel')"},
            { title: "Type of Facilities", value: "Upscale", comment: "Type of facilities ('Luxury/Upscale/Basic')"},
            { title: "Image Count", value: "1", comment: "Image Count"},
            { title: "Image Distinct Count", value: "1", comment: "Image Distinct Count"},
            { title: "Min Image ID", value: "1", comment: "Min Image ID"},
            { title: "Max Image ID", value: "1", comment: "Max Image ID"}
        ],
        data: [
            {
                id: 2003,
                no_of_rooms: '15',
                title: "NH Munich Resort",
                website: "http://www.nh-hotels.com/hotels/munich",
                rating: "3.2000",
                summary: "NH Hotels has six resorts in the city of Munich. Very close to Munich Main Train Station -- the train being one of the most interesting choices of transport for travelling around Germany -- is the four-star NH München Deutscher Kaiser Hotel. In addition to the excellent quality of accommodation that it offers, the hotel is located close to Marienplatz, the monumental central square in the city, the Frauenkirche church, Stachus (Karlsplatz) and the Viktualienmarkt. Other places of interest to explore in Munich are the English garden, the spectacular Nymphenburg Palace and the German Museum, a museum of science and technology very much in keeping with the industrial spirit of the city. Do not forget to visit Munich at the end of September and beginning of October, the time for its most famous international festival: Oktoberfest! Beer, sausages, baked knuckles and other gastronomic specialities await you in a festive atmosphere on the grasslands of Theresienwiese. Not to be missed! And with NH Hotels you can choose the hotels in Munich which best suit your travel plans, with free WiFi and the possibility to bring your pets with you.\n... more",
                opened_on: "1976-06-15 00:00:00",
                luxurious: "true",
                json_col: JSON.stringify({"name":"testing_json"},undefined,2),
                json_col_with_markdown: "Status is: “delivered”",
                category: "Resort",
                type_of_facilities: "Luxury",
                count_image_id: "1",
                count_distinct_image_id: "1",
                min_image_id: "3001",
                max_image_id: "3001"
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
                category: "Hotel",
                type_of_facilities: "Upscale",
                count_image_id: "4",
                count_distinct_image_id: "4",
                min_image_id: "3005",
                max_image_id: "30007"
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
                category: "Motel",
                type_of_facilities: "Basic",
                count_image_id: "3",
                count_distinct_image_id: "3",
                min_image_id: "3009",
                max_image_id: "3011"
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
                category: "Hotel",
                type_of_facilities: "Upscale",
                count_image_id: "",
                count_distinct_image_id: "",
                min_image_id: "",
                max_image_id: ""
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
                rawColumnName: "Y09mXK6LidrvCvNoXbesgg",
                columnPosition: 10,
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
                columnPosition: 11,
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
    }
};

describe('View recordset,', function() {

    var accommodationParams = testParams.accommodation_tuple,
        fileParams = testParams.file_tuple;

    describe("For table " + accommodationParams.table_name + ",", function() {

        beforeAll(function () {
            var keys = [];
            keys.push(accommodationParams.key.name + accommodationParams.key.operator + accommodationParams.key.value);
            browser.ignoreSynchronization=true;
            browser.get(browser.params.url + "/recordset/#" + browser.params.catalogId + "/product-recordset:" + accommodationParams.table_name + "/" + keys.join("&") + "@sort(" + accommodationParams.sortby + ")");

            chaisePage.waitForElement(element(by.id("divRecordSet")));
            chaisePage.recordsetPage.waitForAggregates();
        });

        describe("Presentation ,", function() {
            var recEditUrl =  '';
            it("should have '" + accommodationParams.title +  "' as title", function() {
                var title = chaisePage.recordsetPage.getPageTitleElement();
                expect(title.getText()).toEqual(accommodationParams.title);
            });

            it ('should have the correct tooltip.', function () {
                expect(chaisePage.recordsetPage.getPageTitleTooltip()).toBe(accommodationParams.comment);
            });

            it("should autofocus on search box", function() {
                var searchBox = chaisePage.recordsetPage.getMainSearchBox();
                chaisePage.waitForElement(searchBox);
                expect(searchBox.getAttribute('id')).toEqual(browser.driver.switchTo().activeElement().getAttribute('id'));
            });

            it("should use annotated page size", function() {
                var EC = protractor.ExpectedConditions;
                var e = element(by.id('custom-page-size'));
                browser.wait(EC.presenceOf(e), browser.params.defaultTimeout);
                chaisePage.recordsetPage.getCustomPageSize().then(function(text) {
                    expect(text).toBe("15 (Custom)");
                });
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
                                expect(cells[10].getText()).toBe(accommodationParams.data[index].category, "category column missmatch for row=" + index);
                                expect(cells[11].getText()).toBe(accommodationParams.data[index].type_of_facilities, "type of facilities column missmatch for row=" + index);
                                expect(cells[12].getText()).toBe(accommodationParams.data[index].count_image_id, "count_image_id column missmatch for row=" + index);
                                expect(cells[13].getText()).toBe(accommodationParams.data[index].count_distinct_image_id, "count_distinct_image_id column missmatch for row=" + index);
                                expect(cells[14].getText()).toBe(accommodationParams.data[index].min_image_id, "min_image_id column missmatch for row=" + index);
                                expect(cells[15].getText()).toBe(accommodationParams.data[index].max_image_id, "max_image_id column missmatch for row=" + index);
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

            it("should show line under columns which have a comment and inspect the comment value too", function() {
                var columns = accommodationParams.columns.filter(function(c) {
                    return (c.value != null && typeof c.comment == 'string');
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
            });

            it("apply different searches, ", function(done) {
                var EC = protractor.ExpectedConditions;
                var e = element(by.id('custom-page-size'));
                browser.wait(EC.presenceOf(e), browser.params.defaultTimeout);

                var searchBox = chaisePage.recordsetPage.getMainSearchBox(),
                searchSubmitButton = chaisePage.recordsetPage.getSearchSubmitButton(),
                clearSearchButton = chaisePage.recordsetPage.getSearchClearButton(),
                noResultsMessage = "No Results Found";

                searchBox.sendKeys('Super 8 North Hollywood Motel');
                searchSubmitButton.click().then(function() {
                    chaisePage.recordsetPage.waitForInverseMainSpinner();
                    expect(chaisePage.recordsetPage.getRows().count()).toBe(1, "search 01: row count missmatch");
                    expect(chaisePage.recordsetPage.getTotalCount().getText()).toBe("Displaying 1 of 1 Records", "search 01: total count missmatch.");
                    // clear search
                    return clearSearchButton.click();
                }).then(function() {
                    chaisePage.recordsetPage.waitForInverseMainSpinner();
                    expect(chaisePage.recordsetPage.getRows().count()).toBe(4, "search 02: row count missmatch");
                    expect(chaisePage.recordsetPage.getTotalCount().getText()).toBe("Displaying 4 of 4 Records", "search 02: total count missmatch.");

                    // apply conjunctive search words
                    searchBox.sendKeys('"Super 8" motel "North Hollywood"');
                    return searchSubmitButton.click();
                }).then(function() {
                    chaisePage.recordsetPage.waitForInverseMainSpinner();
                    expect(chaisePage.recordsetPage.getRows().count()).toBe(1, "search 03: row count missmatch");
                    expect(chaisePage.recordsetPage.getTotalCount().getText()).toBe("Displaying 1 of 1 Records", "search 03: total count missmatch.");
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
                    expect(chaisePage.recordsetPage.getTotalCount().getText()).toBe("Displaying 0 Records", "search 04: total count missmatch.");
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
                var searchBox = chaisePage.recordsetPage.getMainSearchBox(),
                searchSubmitButton = chaisePage.recordsetPage.getSearchSubmitButton(),
                clearSearchButton = chaisePage.recordsetPage.getSearchClearButton(),
                noResultsMessage = "No Results Found";
                searchBox.sendKeys('testing_json');
                searchSubmitButton.click().then(function() {
                    return chaisePage.waitForElementInverse(element(by.id("spinner")));
                }).then(function() {
                    return chaisePage.recordsetPage.getRows();
                }).then(function(rows) {
                    expect(rows.length).toBe(1);
                    // clear search
                    return clearSearchButton.click();
                })
            });

            it("action columns should show Download CSV button if records present else should not show download button", function() {
                var downloadButton;
                var searchBox = chaisePage.recordsetPage.getMainSearchBox(),
                searchSubmitButton = chaisePage.recordsetPage.getSearchSubmitButton(),
                clearSearchButton = chaisePage.recordsetPage.getSearchClearButton();

                searchBox.sendKeys('testing_json');
                searchSubmitButton.click().then(function() {
                    return chaisePage.waitForElementInverse(element(by.id("spinner")));
                }).then(function() {
                    return chaisePage.recordsetPage.getDownloadButton();
                }).then(function(downloadButton) {
                    expect(downloadButton.isDisplayed).toBeTruthy("Download button is not present!");
                    return clearSearchButton.click();
                }).then( function(){
                    return chaisePage.waitForElementInverse(element(by.id("spinner")));
                }).then (function() {
                    searchBox.sendKeys("abcdefghijklm");
                    return searchSubmitButton.click();
                }).then ( function(){
                    return chaisePage.waitForElementInverse(element(by.id("spinner")));
                    return chaisePage.recordsetPage.getDownloadButton();
                }).then( function(downloadButton){
                    expect(downloadButton.isDisplayed).toBeFalsy();
                    return clearSearchButton.click();
                });
            });

            it("action columns should show view button that redirects to the record page", function() {
                chaisePage.waitForElementInverse(element(by.id("spinner"))).then(function() {
                    return chaisePage.recordsetPage.getViewActionButtons();
                }).then(function(viewButtons) {
                    expect(viewButtons.length).toBe(4);
                    return viewButtons[0].click();
                }).then(function() {
                    var result = '/record/#' + browser.params.catalogId + "/" + accommodationParams.schemaName + ":" + accommodationParams.table_name + "/id=" + accommodationParams.data[0].id;
                    chaisePage.waitForUrl(result, browser.params.defaultTimeout).finally(function() {
                        expect(browser.driver.getCurrentUrl()).toContain(result);
                        browser.navigate().back();
                    });
                });
            });

            it("action columns should show edit button that redirects to the recordedit page", function() {
                var allWindows;
                chaisePage.waitForElementInverse(element(by.id("spinner"))).then(function() {
                    return chaisePage.recordsetPage.getEditActionButtons();
                }).then(function(editButtons) {
                    expect(editButtons.length).toBe(4);
                    return editButtons[0].click();
                }).then(function() {
                    return browser.getAllWindowHandles();
                }).then(function(handles) {
                    allWindows = handles;
                    return browser.switchTo().window(allWindows[1]);
                }).then(function() {
                    var result = '/recordedit/#' + browser.params.catalogId + "/" + accommodationParams.schemaName + ":" + accommodationParams.table_name + "/id=" + accommodationParams.data[0].id;
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
                    return chaisePage.waitForElementInverse(element(by.id("spinner")));
                }).then(function() {
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

                chaisePage.waitForElementInverse(element(by.id("spinner"))).then(function() {
                    return chaisePage.recordsetPage.getDeleteActionButtons();
                }).then(function(deleteButtons) {
                    expect(deleteButtons.length).toBe(4);
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

        });

        describe("testing sorting and paging features, ", function () {
            var rowCount = chaisePage.recordsetPage.getTotalCount();
            var recordsOnPage1 = accommodationParams.sortedData[0].page1.asc.length;
            var recordsOnPage2 = accommodationParams.sortedData[0].page2.asc.length;
            var totalRecords = recordsOnPage1 + recordsOnPage2;

            beforeAll(function () {
                browser.get(browser.params.url + "/recordset/#" + browser.params.catalogId + "/product-recordset:" + accommodationParams.table_name + "?limit=3");
                var EC = protractor.ExpectedConditions;
                chaisePage.waitForElementInverse(element.all(by.id("spinner")).get(0));
                browser.wait(EC.presenceOf(chaisePage.recordsetPage.getRows().get(2)), browser.params.defaultTimeout);
            });

            for (var j = 0; j < accommodationParams.sortedData.length; j++) {
                (function (k) {
                    it("should sort " + accommodationParams.sortedData[k].columnName + " column in ascending order.", function (done) {

                        // Check the presence of initial sort button
                        expect(chaisePage.recordsetPage.getColumnSortButton(accommodationParams.sortedData[k].rawColumnName).isDisplayed()).toBe(true, accommodationParams.sortedData[k].columnName + " column doesn't contain the initial sort button.");

                        // Click on sort button
                        chaisePage.recordsetPage.getColumnSortButton(accommodationParams.sortedData[k].rawColumnName).click().then(function () {
                            chaisePage.waitForTextInElement(rowCount, "Displaying " + recordsOnPage1 + " of " + totalRecords + " Records");
                            chaisePage.waitForElementInverse(element.all(by.id("spinner")).get(0));

                            //Check the presence of descending sort button
                            expect(chaisePage.recordsetPage.getColumnSortDescButton(accommodationParams.sortedData[k].rawColumnName).isDisplayed()).toBe(true,  accommodationParams.sortedData[k].columnName + " column doesn't contain the descending sort button.");

                            // Check if the url has @sort by column name
                            chaisePage.waitForTextInUrl('@sort(' + accommodationParams.sortedData[k].rawColumnName + ',id)', "Url doesn't contain @sort(column name) for " + accommodationParams.sortedData[k].rawColumnName + " column on Page 1 for ascending order.");

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
                            chaisePage.waitForTextInElement(rowCount, "Displaying " + recordsOnPage2 + " of " + totalRecords + " Records");
                            chaisePage.waitForElementInverse(element.all(by.id("spinner")).get(0));

                            // Check if the url has @sort by column name
                            chaisePage.waitForTextInUrl('@sort(' + accommodationParams.sortedData[k].rawColumnName + ',id)', "Url doesn't contain @sort(column name) for " + accommodationParams.sortedData[k].rawColumnName + " column on Page 2 for ascending order.");

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
                            chaisePage.waitForTextInElement(rowCount, "Displaying " + recordsOnPage1 + " of " + totalRecords + " Records");
                            chaisePage.waitForElementInverse(element.all(by.id("spinner")).get(0));

                            // Sanity check on the previous page
                            chaisePage.waitForTextInUrl('@sort(' + accommodationParams.sortedData[k].rawColumnName + ',id)', "Url doesn't contain @sort(column name) for " + accommodationParams.sortedData[k].rawColumnName + " column on Page 1 for ascending order.");
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
                            chaisePage.waitForTextInElement(rowCount, "Displaying " + recordsOnPage1 + " of " + totalRecords + " Records");
                            chaisePage.waitForElementInverse(element.all(by.id("spinner")).get(0));

                            // Check the presence of ascending sort button
                            expect(chaisePage.recordsetPage.getColumnSortAscButton(accommodationParams.sortedData[k].rawColumnName).isDisplayed()).toBe(true, accommodationParams.sortedData[k].columnName + " column doesn't contain the ascending sort button.");

                            // Check if the url has @sort by column name
                            chaisePage.waitForTextInUrl('@sort(' + accommodationParams.sortedData[k].rawColumnName + '::desc::,id)', "Url doesn't contain @sort(column name) for " + accommodationParams.sortedData[k].rawColumnName + " column on Page 1 for descending order.");

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
                            chaisePage.waitForTextInElement(rowCount, "Displaying " + recordsOnPage2 + " of " + totalRecords + " Records");
                            chaisePage.waitForElementInverse(element.all(by.id("spinner")).get(0));

                            // Check if the url has @sort by column name
                            chaisePage.waitForTextInUrl('@sort(' + accommodationParams.sortedData[k].rawColumnName + '::desc::,id)', "Url doesn't contain @sort(column name) for " + accommodationParams.sortedData[k].rawColumnName + " column on Page 2 for descending order.");

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
                            chaisePage.waitForTextInElement(rowCount, "Displaying " + recordsOnPage1 + " of " + totalRecords + " Records");
                            chaisePage.waitForElementInverse(element.all(by.id("spinner")).get(0));

                            // Sanity check on the previous page
                            chaisePage.waitForTextInUrl('@sort(' + accommodationParams.sortedData[k].rawColumnName + '::desc::,id)', "Url doesn't contain @sort(column name) for " + accommodationParams.sortedData[k].rawColumnName + " column on Page 1 for descending order.");
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

        it("should load the table with " + fileParams.custom_page_size + " rows of data based on the page size annotation.", function() {
            // Verify page count and on first page
            var e = element(by.id("custom-page-size"));

            browser.wait(EC.presenceOf(e), browser.params.defaultTimeout).then(function() {
                browser.wait(function () {
                    return chaisePage.recordsetPage.getRows().count().then(function (ct) {
                        return (ct==fileParams.custom_page_size)
                    });
                });

                return chaisePage.recordsetPage.getRows().count();
            }).then(function(ct) {
                expect(ct).toBe(fileParams.custom_page_size);
            });
        });

        it("should display the proper row count and total row count.", function () {
            chaisePage.recordsetPage.getTotalCount().getText().then(function(text) {
                expect(text).toBe("Displaying 5 of 14 Records");
            });
        });

        it("should have " + fileParams.page_size + " rows after paging to the second page, back to the first, and then changing page size to " + fileParams.page_size + ".", function() {
            var previousBtn = chaisePage.recordsetPage.getPreviousButton();
            // page to the next page then page back to the first page so the @before modifier is applied
            chaisePage.recordsetPage.getNextButton().click().then(function() {
                // wait for it to be on the second page
                browser.wait(EC.elementToBeClickable(previousBtn), browser.params.defaultTimeout);

                return previousBtn.click();
            }).then(function() {
                //wait for it to be on the first page again
                browser.wait(EC.not(EC.elementToBeClickable(previousBtn)), browser.params.defaultTimeout);

                return chaisePage.recordsetPage.getPageLimitDropdown().click();
            }).then(function() {
                // increase the page limit
                return chaisePage.recordsetPage.getPageLimitSelector(fileParams.page_size).click();
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
            });
        });

        it("should have 14 rows and paging buttons disabled when changing the page size to 25.", function() {
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
            });
        });
    });

    describe("For window ID and page ID", function() {
        var windowId, pageId;

        beforeEach(function () {
            var keys = [];
            keys.push(accommodationParams.key.name + accommodationParams.key.operator + accommodationParams.key.value);
            browser.ignoreSynchronization=true;
            browser.get(browser.params.url + "/recordset/#" + browser.params.catalogId + "/product-recordset:" + accommodationParams.table_name + "/" + keys.join("&") + "@sort(" + accommodationParams.sortby + ")");

            chaisePage.waitForElement(element(by.id("divRecordSet"))).then(function () {
                return chaisePage.getWindowName();
            }).then(function (name) {
                windowId = name;
                return chaisePage.getPageId();
            }).then(function (id) {
                pageId = id;
            });
        });

        it("clicking view action should change current window with the same window ID and a new page ID.", function () {
            chaisePage.recordsetPage.getViewActionButtons().then(function(viewButtons) {
                return viewButtons[0].click();
            }).then(function() {
                var result = '/record/#' + browser.params.catalogId + "/" + accommodationParams.schemaName + ":" + accommodationParams.table_name + "/id=" + accommodationParams.data[0].id;
                return chaisePage.waitForUrl(result, browser.params.defaultTimeout);
            }).finally(function() {
                expect(chaisePage.getWindowName()).toBe(windowId);
                // pageId should change when the window changes page
                expect(chaisePage.getPageId()).not.toBe(pageId);
                browser.navigate().back();
                return chaisePage.waitForElementInverse(element(by.id("spinner")));
            }).then(function() {
                expect(chaisePage.getWindowName()).toBe(windowId);
                // pageId should change when navigating back
                expect(chaisePage.getPageId()).not.toBe(pageId);
            });
        });

        it("clicking edit action should open a new window with a new window ID and a new page ID.", function () {
            var allWindows;

            chaisePage.recordsetPage.getEditActionButtons().then(function(editButtons) {
                return editButtons[0].click();
            }).then(function() {
                return browser.getAllWindowHandles();
            }).then(function(handles) {
                allWindows = handles;
                return browser.switchTo().window(allWindows[1]);
            }).then(function() {
                var result = '/recordedit/#' + browser.params.catalogId + "/" + accommodationParams.schemaName + ":" + accommodationParams.table_name + "/id=" + accommodationParams.data[0].id;
                return chaisePage.waitForUrl(result, browser.params.defaultTimeout);
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
            browser.get(url);
            chaisePage.waitForElement(element(by.id('page-title')), browser.params.defaultTimeout).then(function() {
                return browser.executeScript('return chaiseConfig');
            }).then(function(config) {
                chaiseConfig = config;
                expect(chaiseConfig.confirmDelete).toBeTruthy();
                expect(chaiseConfig.defaultCatalog).toBe(1);
                expect(chaiseConfig.defaultTables['1'].schema).toBe("isa");
                expect(chaiseConfig.defaultTables['1'].table).toBe("dataset");
            }).catch(function(error) {
                console.log('ERROR:', error);
                // Fail the test
                expect('There was an error in this promise chain.').toBe('See the error msg for more info.');
            });
        });

        if (!process.env.TRAVIS) {
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
                        expect(title).toBe("Error: MalformedURIError");
                    });
                });
            });
        }
    });
});
