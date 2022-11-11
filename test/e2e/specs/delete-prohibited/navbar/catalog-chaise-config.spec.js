var chaisePage = require('../../../utils/chaise.page.js');

describe('Navbar ', function() {
    var url, navbar, chaiseConfig, EC = protractor.ExpectedConditions;

    beforeAll(function (done) {
        url = browser.params.url + "/recordset/#" + browser.params.catalogId + "/catalog-config-navbar:config-table";
        chaisePage.navigate(url).then(function () {
            navbar = element(by.id('mainnav'));
            
            return browser.executeScript('return chaiseConfig;')
        }).then(function(config) {
            chaiseConfig = config;
            return browser.wait(EC.presenceOf(navbar), browser.params.defaultTimeout);
        }).then(function () {
            return chaisePage.recordsetPageReady();
        }).then(function () {
            done();
        }).catch(function (err) {
            done.fail();
            console.log(err);
        });
    });

    it('should be visible', function() {
        expect(navbar.isDisplayed()).toBeTruthy();
    });

    it('should display the right title from catalog annotation chaiseConfig', function() {
        var actualTitle = element(by.id('brand-text'));
        var expectedTitle = "override test123";
        var wrongTitle = chaiseConfig.navbarBrandText;

        expect(actualTitle.getText()).not.toEqual(wrongTitle, "the titles matched and shouldn't");
        expect(actualTitle.getText()).toEqual(expectedTitle, "the expected title is not shown");
    });

    it('should use the brand image/logo specified in catalog annotation chaiseConfig', function() {
        var actualLogo = element(by.id('brand-image'));
        var expectedLogo = "../images/logo.png";
        var wrongLogo = chaiseConfig.navbarBrandImage;

        expect(actualLogo.isDisplayed()).toBeTruthy();
        expect(actualLogo.getAttribute('src')).not.toMatch(wrongLogo, "the logo matched and shouldn't");
        expect(actualLogo.getAttribute('src')).toMatch(expectedLogo, "the expected logo is not shown");
    });

    it ('should show a banner on top of the navbar', function () {
        var banner = chaisePage.navbar.getBanner();
        expect(banner.isDisplayed()).toBeTruthy();
        expect(banner.getText()).toEqual("This is a banner with link");
    });

    it('should show a link for the login information since chaiseConfig.loggedInMenu is an object', function() {
        expect(element(by.css('.login-menu-options')).getText()).toBe("Outbound Profile Link", "user's displayed name is incorrect");
    });

    if (!process.env.CI){
        it('should open a new tab when clicking the link for the login information', function(done) {
            var allWindows;
            var loginElement = element(by.css('.login-menu-options'));

            loginElement.click().then(function () {
                return browser.getAllWindowHandles();
            }).then(function (tabs) {
                allWindows = tabs;
                expect(allWindows.length).toBe(2, "new tab wasn't opened");

                return browser.switchTo().window(allWindows[1]);
            }).then(function () {
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

    it('should hide the navbar bar if the hideNavbar query parameter is set to true', function () {
        chaisePage.refresh(url + "?hideNavbar=true");
        // browser wait for navbar if not needed, only checking recordset table is present is sufficient 
        chaisePage.recordsetPageReady()

        expect(navbar.isPresent()).toBeFalsy();
    });
});
