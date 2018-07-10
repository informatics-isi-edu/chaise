var chaisePage = require('../../../utils/chaise.page.js');
var testParams = {
    table_name: "accommodation",
    key: {
        name: "id",
        value: "4004",
        operator: "="
    },
    columns: [
        { name: "id", generated: true, immutable: true, title: "Id", value: "2002", type: "serial4", nullok: false},
        { name: "title", title: "Name of Accommodation", value: "Sherathon Hotel", type: "text", nullok: false},
        { name: "website", isUrl: true, title: "Website", value: "<p class=\"ng-scope\"><a href=\"http://www.starwoodhotels.com/sheraton/index.html\">Link to Website</a></p>", type: "text", comment: "A valid url of the accommodation"},
        { name: "category", isForeignKey: true, title: "Category", value: "Hotel", type: "text", comment: "Type of accommodation ('Resort/Hotel/Motel')", presentation: { type: "url", template: "{{{chaise_url}}}/record/#{{catalog_id}}/product-delete:category/id=10003"}, nullok: false},
        { name: "rating", title: "User Rating", value: "4.3000", type: "float4", nullok: false},
        { name: "summary", title: "Summary", nullok: false, value: "Sherathon Hotels is an international hotel company with more than 990 locations in 73 countries. The first Radisson Hotel was built in 1909 in Minneapolis, Minnesota, US. It is named after the 17th-century French explorer Pierre-Esprit Radisson.", type: "longtext"},
        { name: "description", title: "Description", type: "markdown", value: "<p class=\"ng-scope\"><strong>CARING. SHARING. DARING.</strong><br>\nRadisson<sup>®</sup> is synonymous with outstanding levels of service and comfort delivered with utmost style. And today, we deliver even more to make sure we maintain our position at the forefront of the hospitality industry now and in the future.<br>\nOur hotels are service driven, responsible, socially and locally connected and demonstrate a modern friendly attitude in everything we do. Our aim is to deliver our outstanding <code>Yes I Can!</code> <sup>SM</sup> service, comfort and style where you need us.</p>\n<p class=\"ng-scope\"><strong>THE RADISSON<sup>®</sup> WAY</strong> Always positive, always smiling and always professional, Radisson people set Radisson apart. Every member of the team has a dedication to <code>Yes I Can!</code> <sup>SM</sup> hospitality – a passion for ensuring the total wellbeing and satisfaction of each individual guest. Imaginative, understanding and truly empathetic to the needs of the modern traveler, they are people on a special mission to deliver exceptional Extra Thoughtful Care.</p>"},
        { name: "no_of_rooms", title : "Number of Rooms", value: "23", type: "int2"},
        { name: "cover", isForeignKey: true, title: "Cover Image", value: "3,005", type: "int2", presentation: { type: "url", template: "{{{chaise_url}}}/record/#{{catalog_id}}/product-delete:file/id=3005"} },
        { name: "thumbnail", isForeignKey: true, title: "Thumbnail", value: null, type: "int4"},
        { name: "opened_on", title: "Operational Since", value: "12/9/2008, 12:00:00 AM", type: "timestamptz", nullok: false },
        { name: "luxurious", title: "Is Luxurious", value: "false", type: "boolean" }
    ]
};

describe('Edit existing record,', function() {

    describe("For table " + testParams.table_name + ",", function() {

        var table, record;

        beforeAll(function () {
            var keys = [];
            keys.push(testParams.key.name + testParams.key.operator + testParams.key.value);
            browser.ignoreSynchronization=true;
            browser.get(browser.params.url + "/recordedit/#" + browser.params.catalogId + "/product-delete:" + testParams.table_name + "/" + keys.join("&"));
            table = browser.params.defaultSchema.content.tables[testParams.table_name];

            chaisePage.waitForElement(element(by.id("submit-record-button"))).then(function() {
                return chaisePage.recordEditPage.getViewModelRows()
            }).then(function(records) {
                browser.params.record = record = records[0];
                testParams.columns.forEach(function(c) {
                    if (record[c.name]) {
                        if (c.type !== "date" && c.type !== "timestamptz") {
                            c._value =  record[c.name] + "";
                        }
                    }
                });
            });
        });

        describe("delete existing record ", function () {
            it("should load chaise-config.js and have confirmDelete=true", function () {
                browser.executeScript("return chaiseConfig;").then(function(chaiseConfig) {
                    expect(chaiseConfig.confirmDelete).toBe(true);
                });
            });

            xit("should display a modal when attempting to delete a record that has been modified by someone else beforehand", function() {
                var EC = protractor.ExpectedConditions, allWindows;
                // Set up a mismatching ETag scenario before attempting delete to ensure that
                // that the delete operation doesn't throw a 412 error when ETags are mismatching
                // but the referenced tuples haven't changed from the tuples in the DB.
                var modalTitle = chaisePage.recordPage.getConfirmDeleteTitle(),
                    config;

                // Edit the current record in a new tab in order to change the ETag
                // - Open current url in a new tab
                browser.driver.getCurrentUrl().then(function(url) {
                    return browser.executeScript('window.open(arguments[0]);', url);
                }).then(function() {
                    return browser.getAllWindowHandles();
                }).then(function(handles) {
                    allWindows = handles;
                    return browser.switchTo().window(allWindows[1]);
                }).then(function() {
                    // In order to simulate someone else modifying a record (in order to
                    // trigger a 412), we should set RecEdit's window.opener to null so
                    // that RecordSet won't think that this RecEdit page was opened by the same user
                    // from the original page.
                    return browser.executeScript('window.opener = null');
                }).then(function() {
                    return chaisePage.waitForElement(element(by.id("submit-record-button")));
                }).then(function() {
                    // - Change a small thing. Submit.
                    var input = chaisePage.recordEditPage.getInputById(0, 'Summary');
                    input.clear();
                    input.sendKeys('as;dkfa;sljk als;dkj f;alsdjf a;');
                    return chaisePage.recordEditPage.getSubmitRecordButton().click();
                }).then(function(handles) {
                    // - Go back to initial RecordEdit page
                    browser.close();
                    browser.switchTo().window(allWindows[0]);
                }).then(function() {
                    return chaisePage.recordEditPage.getDeleteRecordButton().click()
                }).then(function () {
                    browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);
                    // expect modal to open
                    return modalTitle.getText();
                }).then(function (text) {
                    expect(text).toBe("Confirm Delete");
                    return chaisePage.recordPage.getConfirmDeleteButton().click();
                }).then(function () {
                    // Expect another modal to appear to tell user that this record cannot be deleted without page refresh.
                    var refreshBtn = element(by.id('refresh-btn'));
                    chaisePage.waitForElement(refreshBtn);
                    return refreshBtn.click();
                }).then(function() {
                    return chaisePage.waitForElement(element(by.id('submit-record-button')));
                }).then(function() {
                    changedValue = chaisePage.recordEditPage.getInputById(0, 'Summary');
                    expect(changedValue.getAttribute('value')).toBe('as;dkfa;sljk als;dkj f;alsdjf a;');
                }).catch(function(error) {
                    console.dir(error);
                    expect(error).not.toBeDefined();
                });
            }).pend("412 support has been dropped from ermestjs.");

            it("from recordedit page and redirect to data browser.", function () {
                var EC = protractor.ExpectedConditions,
                    modalTitle = chaisePage.recordPage.getConfirmDeleteTitle(),
                    config, redirectUrl;

                browser.executeScript('return chaiseConfig;').then(function(chaiseConfig) {
                    config = chaiseConfig;
                    return chaisePage.recordEditPage.getDeleteRecordButton().click()
                }).then(function () {
                    browser.wait(EC.visibilityOf(modalTitle), browser.params.defaultTimeout);
                    // expect modal to open
                    return modalTitle.getText();
                }).then(function (text) {
                    expect(text).toBe("Confirm Delete");

                    return chaisePage.recordPage.getConfirmDeleteButton().click();
                }).then(function () {
                    redirectUrl = process.env.CHAISE_BASE_URL + "/search/";

                    browser.wait(function () {
                        return browser.driver.getCurrentUrl().then(function(url) {
                            return url.startsWith(redirectUrl);
                        });
                    });

                    return browser.driver.getCurrentUrl();
                }).then(function (url) {
                    expect(url.startsWith(redirectUrl)).toBe(true);
                });
            });
        });
    });
});
