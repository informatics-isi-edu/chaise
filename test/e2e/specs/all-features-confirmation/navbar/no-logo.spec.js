describe('Navbar ', function() {
    var navbar, menu, chaiseConfig, EC = protractor.ExpectedConditions;

    beforeAll(function () {
        browser.ignoreSynchronization=true;
        browser.get(browser.params.url + "/recordset/#" + browser.params.catalogId + "/product-navbar:accommodation");
        navbar = element(by.id('mainnav'));
        menu = element(by.id('navbar-menu'));
        browser.executeScript('return chaiseConfig').then(function(config) {
            chaiseConfig = config;
            browser.wait(EC.presenceOf(navbar), browser.params.defaultTimeout);
        });
    });

    it('should be visible', function() {
        expect(navbar.isDisplayed()).toBeTruthy();
    });

    it('should display the right title from chaiseConfig', function() {
        var actualTitle = element(by.id('brand-text'));
        // Should be default value set by `setConfigJson()`
        var expectedTitle = "Chaise";
        expect(actualTitle.getText()).toEqual(expectedTitle);
    });

    it('should include the headTitle from chaiseConfig in the tab title (head > title)', function(done) {
        browser.getTitle().then(function (title) {
            // only testing headTitle is included. Tests for full head title are distributed between each presentation spec
            expect(title.indexOf(chaiseConfig.headTitle)).toBeGreaterThan(-1, "the headTitle from the chaise config is not included in the head title element");

            done();
        }).catch(function (err) {
            done.fail();
            console.log(err);
        });
    });

    it('should not display a brand image/logo', function() {
        expect(element(by.id('brand-image')).isPresent()).toBeFalsy();
    });

    describe('for the menu', function () {
        var allWindows;

        it('should generate the correct # of list items', function() {
            var nodesInDOM = menu.all(by.tagName('li'));
            var counter = 7; // counted from chaise config doc rather than having code count

            nodesInDOM.count().then(function(count) {
                expect(count).toEqual(counter, "number of nodes present does not match what's defined in chaise-config");
            });
        });

        if (!process.env.CI){
            // Menu options: ['Search', 'RecordSets', 'Dataset', 'File', 'RecordEdit', 'Add Records', 'Edit Existing Record']
            it('top level menu with no children should use default "newTab" value and navigate in a new tab', function (done) {
                var searchOption = menu.all(by.tagName('li')).get(0);
                expect(searchOption.getText()).toBe("Search", "First top level menu option text is incorrect");

                searchOption.click().then(function () {
                    return browser.getAllWindowHandles();
                }).then(function (tabs) {
                    allWindows = tabs;
                    expect(allWindows.length).toBe(2, "new tab wasn't opened");

                    return browser.switchTo().window(allWindows[1]);
                }).then(function () {
                    return browser.driver.getCurrentUrl();
                }).then(function (url) {
                    expect(url.indexOf("/chaise/search/#1/isa:dataset")).toBeGreaterThan(0, "new tab url doesn't include '/chaise/search' path");
                    browser.close();

                    return browser.switchTo().window(allWindows[0]);
                }).then(function () {
                    done();
                }).catch(function (err) {
                    console.dir(err);
                    done.fail();
                });
            });

            it('first level nested link should inherit newTab value from parent when newTab is undefined and navigate in new tab', function (done) {
                var recordsetsMenu = menu.all(by.tagName('li')).get(1);
                expect(recordsetsMenu.getText()).toBe("RecordSets", "Second top level menu option text is incorrect");

                recordsetsMenu.click().then(function () {
                    var datasetOption = recordsetsMenu.all(by.tagName('li')).get(0);
                    expect(datasetOption.getText()).toBe("Dataset", "First 2nd level option for 'RecordSets' is in incorrect");

                    return datasetOption.click();
                }).then(function () {
                    return browser.getAllWindowHandles();
                }).then(function (tabs) {
                    allWindows = tabs;
                    expect(allWindows.length).toBe(2, "new tab wasn't opened");

                    return browser.switchTo().window(allWindows[1]);
                }).then(function () {
                    return browser.driver.getCurrentUrl();
                }).then(function (url) {
                    expect(url.indexOf("/chaise/recordset/#" + browser.params.catalogId + "/isa:dataset")).toBeGreaterThan(0, "new tab url doesn't include '/chaise/recordset' path");
                    browser.close();

                    return browser.switchTo().window(allWindows[0]);
                }).then(function () {
                    done();
                }).catch(function (err) {
                    console.dir(err);
                    done.fail();
                });
            });
        }
    });

    // TODO: These tests are xit'd because we don't handle tests logging in via Globus/other services just yet
    // e.g. On Travis, the user is logged in. On local machines, you must log in manually, which changes the desired order of specs.
    xit('should have a "Log In" link', function() {
        var actualLink = element(by.id('login-link'));
        browser.wait(EC.elementToBeClickable(actualLink), browser.params.defaultTimeout).then(function() {
            expect(actualLink.isDisplayed()).toBeTruthy();
        });
    }).pend("Pending until we handle tests logging in via Globus/other services");

    xit('should not display a "Sign Up" link', function() {
        expect(element(by.id('signup-link')).isPresent()).toBeFalsy();
    }).pend("Pending until we handle tests logging in via Globus/other services");

    xit('should display a "Log Out" link', function() {
        var logOutLink = element(by.id('logout-link'));
        browser.wait(EC.elementToBeClickable(logOutLink), browser.params.defaultTimeout).then(function() {
            browser.ignoreSynchronization = true;
            expect(logOutLink.isDisplayed()).toBeTruthy();
        });
    }).pend("Pending until we handle tests logging in via Globus/other services");

    xit('should not link to a profile URL on the username', function() {
        var actual = element.all(by.css('.username'));
        expect(actual.count()).toEqual(1);
        expect(actual.getAttribute('href')).toBeFalsy();
    }).pend("Pending until we handle tests logging in via Globus/other services");
});
