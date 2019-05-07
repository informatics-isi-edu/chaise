var chaisePage = require('../../../utils/chaise.page.js');

describe('Navbar ', function() {
    var navbar, chaiseConfig, EC = protractor.ExpectedConditions;

    beforeAll(function () {
        browser.ignoreSynchronization=true;
        browser.get(browser.params.url + "/recordset/#" + browser.params.catalogId + "/catalog-config-navbar:config-table");
        navbar = element(by.id('mainnav'));
        browser.executeScript('return chaiseConfig;').then(function(config) {
            chaiseConfig = config;
            browser.wait(EC.presenceOf(navbar), browser.params.defaultTimeout);
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
});
