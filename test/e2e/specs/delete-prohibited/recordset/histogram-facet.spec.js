var chaisePage = require('../../../utils/chaise.page.js');
var EC = protractor.ExpectedConditions;
var testParams = {
    schema_name: "histogram-faceting",
    table_name: "main",
    totalNumFacets: 4,
    facetNames: ["int_col", "float_col", "date_col", "timestamp_col"],
    facets: [
        {
            name: "int_col",
            absMin: "1",
            absMax: "30",
            zoom1: { min: "7", max: "25" },
            zoom2: { min: "9", max: "21" },
            allRecords: "Displaying 25 of 195 Records",
            zoom3: { min: "11", max: "19" }
        }, {
            name: "float_col",
            absMin: "1.1",
            absMax: "30.3",
            zoom1: { min: "6.94", max: "24.46" },
            zoom2: { min: "10.444", max: "20.956" },
            allRecords: "Displaying 25 of 155 Records",
            zoom3: { min: "12.5464", max: "18.8536" }
        }, {
            name: "date_col",
            absMin: "2001-01-01",
            absMax: "2030-06-30",
            zoom1: { min: "2006-11-27", max: "2024-08-12" },
            zoom2: { min: "2010-06-13", max: "2021-01-28" },
            allRecords: "Displaying 25 of 165 Records",
            zoom3: { min: "2012-07-30", max: "2018-12-20" }
        }, {
            name: "timestamp_col",
            absMin: { date: "2007-04-06", time: "01:01:01" },
            absMax: { date: "2007-09-30", time: "06:30:30" },
            zoom1: {
                min: {date: "2007-05-11", time: "11:42:54"},
                max: {date: "2007-08-25", time: "19:48:36"}
            },
            zoom2: {
                min: {date: "2007-06-01", time: "18:08:02"},
                max: {date: "2007-08-04", time: "13:23:27"}
            },
            allRecords: "Displaying 25 of 155 Records",
            zoom3: {
                min: {date: "2007-06-14", time: "12:23:07"},
                max: {date: "2007-07-22", time: "19:08:22"}
            }
        }
    ]
};


describe("Viewing Recordset with Faceting,", function() {

    describe("For table " + testParams.table_name + ",", function() {

        var table, record,
        uri = browser.params.url + "/recordset/#" + browser.params.catalogId + "/" + testParams.schema_name + ":" + testParams.table_name;

        beforeAll(function () {
            browser.ignoreSynchronization=true;
            browser.get(uri);
            chaisePage.waitForElementInverse(element(by.id("spinner")));

            // close the first facet
            chaisePage.recordsetPage.getFacetById(0).click();
        });

        it("should have " + testParams.totalNumFacets + " facets", function () {
            chaisePage.recordsetPage.getAllFacets().count().then(function (ct) {
                expect(ct).toBe(testParams.totalNumFacets, "Number of facets is incorrect");

                return chaisePage.recordsetPage.getFacetTitles();
            }).then(function (titles) {
                expect(titles).toEqual(testParams.facetNames, "Displayed list of facets is incorrect");
            });
        });

        describe("testing histogram functions for each facet type", function () {

            for (var j=0; j<testParams.totalNumFacets; j++) {
                // anon function capture looping variables
                (function(facetParams, idx) {
                    describe("for facet: " + facetParams.name + ",", function () {

                        beforeAll(function() {
                            var minInput, maxInput, minDateInput, minTimeInput, maxDateInput, maxTimeInput,
                                zoomBtn, zoomBtnDisabled, unzoomBtn, unzoomBtnDisabled;
                            // open the facet
                            browser.wait(function () {
                                return chaisePage.recordsetPage.getClosedFacets().count().then(function(ct) {
                                    return ct == testParams.totalNumFacets;
                                });
                            }, browser.params.defaultTimeout).then(function () {
                                return chaisePage.recordsetPage.getFacetById(idx).click();
                            });
                        });

                        // inputs are handled differently
                        if (facetParams.name == "timestamp_col") {
                            it("should have a histogram displayed with min/max inputs filled in.", function () {
                                // wait for facet to open
                                browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getFacetCollapse(idx)), browser.params.defaultTimeout);
                                browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getRangeSubmit(idx)), browser.params.defaultTimeout);
                                // browser.pause();
                                chaisePage.recordsetPage.getHistogram(idx).isDisplayed().then(function (bool) {
                                    expect(bool).toBeTruthy();

                                    minDateInput = chaisePage.recordsetPage.getRangeMinInput(idx, "ts-date-range-min");
                                    minTimeInput = chaisePage.recordsetPage.getRangeMinInput(idx, "ts-time-range-min");
                                    maxDateInput = chaisePage.recordsetPage.getRangeMaxInput(idx, "ts-date-range-max");
                                    maxTimeInput = chaisePage.recordsetPage.getRangeMaxInput(idx, "ts-time-range-max");

                                    expect(minDateInput.getAttribute("value")).toBe(facetParams.absMin.date, "initial min date value is incorrect");
                                    expect(minTimeInput.getAttribute("value")).toBe(facetParams.absMin.time, "initial min time value is incorrect");
                                    expect(maxDateInput.getAttribute("value")).toBe(facetParams.absMax.date, "initial max date value is incorrect");
                                    expect(maxTimeInput.getAttribute("value")).toBe(facetParams.absMax.time, "initial max time value is incorrect");
                                });
                            });

                            it("unzoom should be disabled, clicking zoom should zoom in and enable the unzoom button.", function () {
                                zoomBtn = chaisePage.recordsetPage.getPlotlyZoom(idx);
                                zoomBtnDisabled = chaisePage.recordsetPage.getPlotlyZoomDisabled(idx);
                                unzoomBtn = chaisePage.recordsetPage.getPlotlyUnzoom(idx);
                                unzoomBtnDisabled = chaisePage.recordsetPage.getPlotlyUnzoomDisabled(idx);

                                unzoomBtnDisabled.count().then(function (ct) {
                                    expect(ct).toBe(1, "unzoom button is not disabled when zoomed out");

                                    return zoomBtn.click();
                                }).then(function () {
                                    expect(minDateInput.getAttribute("value")).toBe(facetParams.zoom1.min.date, "min date input after zoom 1 is incorrect");
                                    expect(minTimeInput.getAttribute("value")).toBe(facetParams.zoom1.min.time, "min time input after zoom 1 is incorrect");
                                    expect(maxDateInput.getAttribute("value")).toBe(facetParams.zoom1.max.date, "max date input after zoom 1 is incorrect");
                                    expect(maxTimeInput.getAttribute("value")).toBe(facetParams.zoom1.max.time, "max time input after zoom 1 is incorrect");

                                    return unzoomBtnDisabled.count();
                                }).then(function (ct) {
                                    expect(ct).toBe(0, "unzoom button is disbaled still");
                                });
                            });

                            it("zoom in again and submit the range filter should display the proper resultset.", function () {
                                zoomBtn.click().then(function () {
                                    expect(minDateInput.getAttribute("value")).toBe(facetParams.zoom2.min.date, "min date input after zoom 2 is incorrect");
                                    expect(minTimeInput.getAttribute("value")).toBe(facetParams.zoom2.min.time, "min time input after zoom 2 is incorrect");
                                    expect(maxDateInput.getAttribute("value")).toBe(facetParams.zoom2.max.date, "max date input after zoom 2 is incorrect");
                                    expect(maxTimeInput.getAttribute("value")).toBe(facetParams.zoom2.max.time, "max time input after zoom 2 is incorrect");

                                    return chaisePage.recordsetPage.getRangeSubmit(idx).click();
                                }).then(function () {
                                    return chaisePage.recordsetPage.getFacetFilters().count();
                                }).then(function (ct) {
                                    expect(ct).toBe(1, "Number of visible filters is incorrect");

                                    return chaisePage.recordsetPage.getTotalCount().getText();
                                }).then(function (text) {
                                    expect(text).toBe(facetParams.allRecords, "all records display text is incorrect");
                                });
                            });

                            it("zoom in once more, unzoom once, then reset the histogram.", function () {
                                zoomBtn.click().then(function () {
                                    expect(minDateInput.getAttribute("value")).toBe(facetParams.zoom3.min.date, "min date input after zoom 3 is incorrect");
                                    expect(minTimeInput.getAttribute("value")).toBe(facetParams.zoom3.min.time, "min time input after zoom 3 is incorrect");
                                    expect(maxDateInput.getAttribute("value")).toBe(facetParams.zoom3.max.date, "max date input after zoom 3 is incorrect");
                                    expect(maxTimeInput.getAttribute("value")).toBe(facetParams.zoom3.max.time, "max time input after zoom 3 is incorrect");

                                    return unzoomBtn.click();
                                }).then(function () {
                                    expect(minDateInput.getAttribute("value")).toBe(facetParams.zoom2.min.date, "min date input after unzoom is incorrect");
                                    expect(minTimeInput.getAttribute("value")).toBe(facetParams.zoom2.min.time, "min time input after unzoom is incorrect");
                                    expect(maxDateInput.getAttribute("value")).toBe(facetParams.zoom2.max.date, "max date input after unzoom is incorrect");
                                    expect(maxTimeInput.getAttribute("value")).toBe(facetParams.zoom2.max.time, "max time input after unzoom is incorrect");

                                    return chaisePage.recordsetPage.getPlotlyReset(idx).click();
                                }).then(function () {
                                    expect(minDateInput.getAttribute("value")).toBe(facetParams.absMin.date, "min date input after reset is incorrect");
                                    expect(minTimeInput.getAttribute("value")).toBe(facetParams.absMin.time, "min time input after reset is incorrect");
                                    expect(maxDateInput.getAttribute("value")).toBe(facetParams.absMax.date, "max date input after reset is incorrect");
                                    expect(maxTimeInput.getAttribute("value")).toBe(facetParams.absMax.time, "max time input after reset is incorrect");
                                });
                            });

                            it("clear all filters should reset the histogram.", function () {
                                zoomBtn.click().then(function () {
                                    expect(minDateInput.getAttribute("value")).toBe(facetParams.zoom1.min.date, "min date input after zoom 1 is incorrect");
                                    expect(minTimeInput.getAttribute("value")).toBe(facetParams.zoom1.min.time, "min time input after zoom 1 is incorrect");
                                    expect(maxDateInput.getAttribute("value")).toBe(facetParams.zoom1.max.date, "max date input after zoom 1 is incorrect");
                                    expect(maxTimeInput.getAttribute("value")).toBe(facetParams.zoom1.max.time, "max time input after zoom 1 is incorrect");

                                    return chaisePage.recordsetPage.getClearAllFilters().click();
                                }).then(function () {
                                    chaisePage.waitForElementInverse(element(by.id("spinner")));

                                    expect(minDateInput.getAttribute("value")).toBe(facetParams.absMin.date, "min date input after clear all is incorrect");
                                    expect(minTimeInput.getAttribute("value")).toBe(facetParams.absMin.time, "min time input after clear all is incorrect");
                                    expect(maxDateInput.getAttribute("value")).toBe(facetParams.absMax.date, "max date input after clear all is incorrect");
                                    expect(maxTimeInput.getAttribute("value")).toBe(facetParams.absMax.time, "max time input after clear all is incorrect");
                                });
                            });

                        // case for int_col, float_col, date_col
                        } else {
                            it("should have a histogram displayed with min/max inputs filled in.", function () {
                                // wait for facet to open
                                browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getFacetCollapse(idx)), browser.params.defaultTimeout);
                                browser.wait(EC.visibilityOf(chaisePage.recordsetPage.getRangeSubmit(idx)), browser.params.defaultTimeout);
                                // browser.pause();
                                chaisePage.recordsetPage.getHistogram(idx).isDisplayed().then(function (bool) {
                                    expect(bool).toBeTruthy();

                                    minInput = chaisePage.recordsetPage.getRangeMinInput(idx, "range-min");
                                    maxInput = chaisePage.recordsetPage.getRangeMaxInput(idx, "range-max");

                                    expect(minInput.getAttribute("value")).toBe(facetParams.absMin, "initial min value is incorrect");
                                    expect(maxInput.getAttribute("value")).toBe(facetParams.absMax, "initial max value is incorrect");
                                });
                            });

                            it("unzoom should be disabled, clicking zoom should zoom in and enable the unzoom button.", function () {
                                zoomBtn = chaisePage.recordsetPage.getPlotlyZoom(idx);
                                zoomBtnDisabled = chaisePage.recordsetPage.getPlotlyZoomDisabled(idx);
                                unzoomBtn = chaisePage.recordsetPage.getPlotlyUnzoom(idx);
                                unzoomBtnDisabled = chaisePage.recordsetPage.getPlotlyUnzoomDisabled(idx);

                                unzoomBtnDisabled.count().then(function (ct) {
                                    expect(ct).toBe(1, "unzoom button is not disabled when zoomed out");

                                    return zoomBtn.click();
                                }).then(function () {
                                    expect(minInput.getAttribute("value")).toBe(facetParams.zoom1.min, "min input after zoom 1 is incorrect");
                                    expect(maxInput.getAttribute("value")).toBe(facetParams.zoom1.max, "max input after zoom 1 is incorrect");

                                    return unzoomBtnDisabled.count();
                                }).then(function (ct) {
                                    expect(ct).toBe(0, "unzoom button is disbaled still");
                                });
                            });

                            it("zoom in again and submit the range filter should display the proper resultset.", function () {
                                zoomBtn.click().then(function () {
                                    expect(minInput.getAttribute("value")).toBe(facetParams.zoom2.min, "min input after zoom 2 is incorrect");
                                    expect(maxInput.getAttribute("value")).toBe(facetParams.zoom2.max, "max input after zoom 2 is incorrect");

                                    return chaisePage.recordsetPage.getRangeSubmit(idx).click();
                                }).then(function () {
                                    return chaisePage.recordsetPage.getFacetFilters().count();
                                }).then(function (ct) {
                                    expect(ct).toBe(1, "Number of visible filters is incorrect");

                                    return chaisePage.recordsetPage.getTotalCount().getText();
                                }).then(function (text) {
                                    expect(text).toBe(facetParams.allRecords, "all records display text is incorrect");
                                });
                            });

                            it("zoom in once more, unzoom once, then reset the histogram.", function () {
                                zoomBtn.click().then(function () {
                                    expect(minInput.getAttribute("value")).toBe(facetParams.zoom3.min, "min input after zoom 3 is incorrect");
                                    expect(maxInput.getAttribute("value")).toBe(facetParams.zoom3.max, "max input after zoom 3 is incorrect");

                                    if (facetParams.name == "int_col") {
                                        expect(zoomBtnDisabled.count()).toBe(1, "zoom button is not disabled");
                                    }

                                    return unzoomBtn.click();
                                }).then(function () {
                                    expect(minInput.getAttribute("value")).toBe(facetParams.zoom2.min, "min input after unzoom is incorrect");
                                    expect(maxInput.getAttribute("value")).toBe(facetParams.zoom2.max, "max input after unzoom is incorrect");

                                    return chaisePage.recordsetPage.getPlotlyReset(idx).click();
                                }).then(function () {
                                    expect(minInput.getAttribute("value")).toBe(facetParams.absMin, "initial min value after reset is incorrect");
                                    expect(maxInput.getAttribute("value")).toBe(facetParams.absMax, "initial max value after reset is incorrect");
                                });
                            });

                            it("clear all filters should reset the histogram.", function () {
                                zoomBtn.click().then(function () {
                                    expect(minInput.getAttribute("value")).toBe(facetParams.zoom1.min, "min input after zoom 1 is incorrect");
                                    expect(maxInput.getAttribute("value")).toBe(facetParams.zoom1.max, "max input after zoom 1 is incorrect");

                                    return chaisePage.recordsetPage.getClearAllFilters().click();
                                }).then(function () {
                                    chaisePage.waitForElementInverse(element(by.id("spinner")));

                                    expect(minInput.getAttribute("value")).toBe(facetParams.absMin, "initial min value after clear all is incorrect");
                                    expect(maxInput.getAttribute("value")).toBe(facetParams.absMax, "initial max value after clear all is incorrect");
                                });
                            });
                        }

                        afterAll(function () {
                            // close the facet
                            chaisePage.recordsetPage.getFacetById(idx).click();
                        });
                    });
                })(testParams.facets[j], j);
            }
        });

        describe ("going to a page with filters that return no data.", function () {
            beforeAll(function () {
                var noDataUri = uri + "/int_col::leq::0&float_col::leq::0&date_col::leq::2000-01-01&timestamp_col::leq::2000-01-01";
                browser.get(noDataUri);
                chaisePage.waitForElementInverse(element(by.id("spinner")));
            });

            it ("no data should be represented to the user.", function () {
                expect(chaisePage.recordsetPage.getRows().count()).toBe(0);
            });

            it ("no histogram should be displayed.", function () {
                for(var i = 0; i < testParams.totalNumFacets; i++) {
                    expect(chaisePage.recordsetPage.getHistogram(i).isPresent()).toBeFalsy("histogram is available for facet index=" + i);
                }
            });
        });
    });
});
