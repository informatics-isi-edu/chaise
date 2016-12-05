describe('Navbar ', function() {
    var navbar, menu, chaiseConfig, EC = protractor.ExpectedConditions;

    beforeAll(function (done) {
        browser.ignoreSynchronization=true;
        browser.get(browser.params.url || "");
        navbar = element(by.id('mainnav'));
        menu = element(by.id('navbar-menu'));
        browser.executeScript('return chaiseConfig').then(function(config) {
            chaiseConfig = config;
            return browser.wait(EC.presenceOf(navbar), 5000);
        }).then(function() {
            done();
        });
    });

    it('should be visible', function() {
        expect(navbar.isDisplayed()).toBeTruthy();
    });

    it('should display the right title from chaiseConfig', function() {
        var actualTitle = element(by.id('brand-text'));
        var expectedTitle = chaiseConfig.navbarBrandText;
        expect(actualTitle.getText()).toEqual(expectedTitle);
    });

    it('should use the brand image/logo specified in chaiseConfig', function() {
        var actualLogo = element(by.id('brand-image'));
        var expectedLogo = chaiseConfig.navbarBrandImage;
        expect(actualLogo.isDisplayed()).toBeTruthy();
        expect(actualLogo.getAttribute('src')).toMatch(expectedLogo);
    });

    it('for the menu, should generate the correct # of list items', function() {
        var nodesInDOM = menu.all(by.tagName('li'));
        var counter = 0;
        function countNodes(array) {
            array.forEach(function(element) {
                counter++;
                if (element.children) {
                    countNodes(element.children);
                }
            });
            return counter;
        }
        countNodes(chaiseConfig.navbarMenu.children);

        nodesInDOM.count().then(function(count) {
            expect(count).toEqual(counter);
        });
    });

    // TODO: These tests are xit'd because we don't handle tests logging in via Globus/other services just yet
    // e.g. On Travis, the user is logged in. On local machines, you must log in manually, which changes the desired order of specs.
    xit('should have a "Log In" link', function() {
        var actualLink = element(by.id('login-link'));
        browser.wait(EC.elementToBeClickable(actualLink), 10000).then(function() {
            expect(actualLink.isDisplayed()).toBeTruthy();
        });
    }).pend("Pending until we handle tests logging in via Globus/other services");

    xit('should have a "Sign Up" link with the right href from chaiseConfig', function(done) {
        var actualLink = element(by.id('signup-link'));
        browser.wait(EC.elementToBeClickable(actualLink), 10000).then(function() {
            expect(actualLink.isDisplayed()).toBeTruthy();
            expect(actualLink.getAttribute('href')).toMatch(chaiseConfig.signUpURL);
            done();
        });
    }).pend("Pending until we handle tests logging in via Globus/other services");

    xit('should display a "Log Out" link', function(done) {
        var logOutLink = element(by.id('logout-link'));
        browser.wait(EC.elementToBeClickable(logOutLink), 10000).then(function() {
            browser.ignoreSynchronization = true;
            expect(logOutLink.isDisplayed()).toBeTruthy();
            done();
        });
    }).pend("Pending until we handle tests logging in via Globus/other services");

    xit('should link to the profile URL from chaiseConfig', function() {
        var actual = element.all(by.css('.username'));
        expect(actual.count()).toEqual(1);
        expect(actual.getAttribute('href')).toEqual(chaiseConfig.profileURL);
    }).pend("Pending until we handle tests logging in via Globus/other services");
});
