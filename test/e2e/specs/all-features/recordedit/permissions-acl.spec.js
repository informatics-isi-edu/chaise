var chaisePage = require('../../../utils/chaise.page.js');
var recordEditPage = chaisePage.recordEditPage;


describe("When viewing RecordEdit app", function () {
    var EC = protractor.ExpectedConditions, baseUrl, url, modalBody;
    beforeAll(function() {
        baseUrl = browser.params.url + "/recordedit/#" + browser.params.catalogId + "/multi-permissions";
        browser.ignoreSynchronization = true;
    });

    describe('as anonymous user', function() {
        beforeAll(function(done) {
            chaisePage.performLogin(process.env.AUTH_COOKIE + "expires=Thu, 01 Jan 1970 00:00:01 GMT;", true).then(function() {
                done();
            }).catch(function(err) {
                done.fail(err);
            });
        });

        it("user should be shown login modal", function(done) {
            url = baseUrl + ':main_create_table/id=1';
            modalBody = element(by.css('.modal-body'));

            browser.get(url).then(function () {
                return chaisePage.waitForElement(modalBody);
            }).then(function() {
                expect(modalBody.isDisplayed()).toBe(true, "modal body is not displayed");
                expect(element(by.css('.modal-title')).isPresent()).toBe(true, "modal title is not present");
                expect(element(by.css('.modal-title')).getText()).toBe('You need to be logged in to continue.', "modal title text is incorrect");
                done();
            }).catch(function (err) {
                done.fail(err);
            })
        });

        afterAll(function(done) {
            chaisePage.performLogin(process.env.AUTH_COOKIE, false).then(function() {
                done();
            }).catch(function(err) {
                done.fail(err);
            });
        });
    });

    // describe("regarding static acls", function () {
    //
    // });

    // describe('regarding dynamic acls', function () {
    //
    // });
});
