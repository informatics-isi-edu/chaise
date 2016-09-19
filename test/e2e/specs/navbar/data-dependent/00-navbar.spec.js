describe('Navbar ', function() {
    var navbar, menu, chaiseConfig, EC = protractor.ExpectedConditions;

    beforeAll(function (done) {
        browser.get(browser.params.url || "");
        navbar = element(by.id('mainnav'));
        menu = element(by.id('navbar-menu'));
        browser.executeScript('return chaiseConfig').then(function(config) {
            chaiseConfig = config;
            console.log('1', chaiseConfig);
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
        var expectedTitle = chaiseConfig.navbarBrandText || chaiseConfig.headTitle;
        expect(actualTitle.getText()).toEqual(expectedTitle);
    });

    it('should use the image specified in chaiseConfig', function() {
        if (!chaiseConfig.navbarBrandImage) {
            expect(element(by.id('brand-image')).isPresent()).toBeFalsy();
        } else {
            var actualLogo = element(by.id('brand-image'));
            var expectedLogo = chaiseConfig.navbarBrandImage;
            expect(actualLogo.isDisplayed()).toBeTruthy();
            expect(actualLogo.getAttribute('src')).toMatch(expectedLogo);
        }
    });

    it('should have a "Log In" link', function() {
        var actualLink = element(by.id('login-link'));
        browser.wait(EC.elementToBeClickable(actualLink), 10000).then(function() {
            expect(actualLink.isDisplayed()).toBeTruthy();
        });
    });

    it('should have a "Sign Up" link with the right href from chaiseConfig', function(done) {
        if (chaiseConfig.signUpURL) {
            var actualLink = element(by.id('signup-link'));
            browser.wait(EC.elementToBeClickable(actualLink), 10000).then(function() {
                expect(actualLink.isDisplayed()).toBeTruthy();
                expect(actualLink.getAttribute('href')).toMatch(chaiseConfig.signUpURL);
                done();
            });
        } else {
            expect(element(by.id('signup-link')).isDisplayed()).toBeFalsy();
            done();
        }
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

    // These last 2 xit'd because we don't handle tests logging in via Globus/other services just yet
    xit('should display a "Log Out" link', function(done) {
        element(by.id('login-link')).click();
        browser.sleep(5000);
        browser.get(browser.params.url || "");
        var logOutLink = element(by.id('logout-link'));
        browser.wait(EC.elementToBeClickable(logOutLink), 10000).then(function() {
            browser.ignoreSynchronization = true;
            expect(logOutLink.isDisplayed()).toBeTruthy();
            done();
        });
    });

    xit('should link to the profile URL from chaiseConfig, if specified', function() {
        var actual = element.all(by.css('.username'));
        expect(actual.count()).toEqual(1);
        if (chaiseConfig.profileURL) {
            expect(actual.getAttribute('href')).toEqual(chaiseConfig.profileURL);
        } else {
            expect(actual.getAttribute('href')).toBeFalsy();
        }
    });
});
