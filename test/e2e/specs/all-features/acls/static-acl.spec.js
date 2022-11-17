var chaisePage = require('../../../utils/chaise.page.js');
describe("regarding static ACL support, ", function () {
    it("anonymous user should be shown login modal", function(done) {
        modalBody = element(by.css('.modal-body'));

        browser.ignoreSynchronization = true;
        var url = browser.params.url + "/recordedit/#" + browser.params.catalogId + "/multi-permissions:main_create_table/id=1";
        browser.get(url).then(function () {
            // manually remove the cookie
            return browser.manage().deleteCookie('webauthn');
        }).then(function () {
            // refresh the page
            return browser.navigate().refresh();
        }).then(function () {
            return chaisePage.waitForElement(modalBody);
        }).then(function() {
            expect(modalBody.isDisplayed()).toBe(true, "modal body is not displayed");
            expect(element(by.css('.modal-title')).isPresent()).toBe(true, "modal title is not present");
            expect(element(by.css('.modal-title')).getText()).toBe('You need to be logged in to continue.', "modal title text is incorrect");

            // add the cookie again for the rest of test cases
            return chaisePage.performLogin(process.env.AUTH_COOKIE);
        }).then(function () {
            done();
        }).catch(function (err) {
            done.fail(err);
        })
    });

    // TODO more static acl tests should be added
})
