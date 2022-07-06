let chaisePage = require('../../../utils/chaise.page.js');

describe('Navbar ', function() {
    let navbar, menu, chaiseConfig, EC = protractor.ExpectedConditions;

    beforeAll(function () {
        chaisePage.navigate(browser.params.url + "/recordset/#" + browser.params.catalogId + "/product-navbar:accommodation");
        
        navbar = element(by.id('mainnav'));
        // menu = element(by.id('navbar-menu'));
        menu = element(by.css('.navbar-menu-options'));
        browser.executeScript('return chaiseConfig;').then(function(config) {
            chaiseConfig = config;
            browser.wait(EC.presenceOf(navbar), browser.params.defaultTimeout);
        });
    });

    it('should be visible', function() {
        expect(navbar.isDisplayed()).toBeTruthy();
    });

    it('should display the right title from chaiseConfig', function() {
        var actualTitle = element(by.id('brand-text'));
        let expectedTitle = chaiseConfig.navbarBrandText;
        expect(actualTitle.getText()).toEqual(expectedTitle);
    });

    it('should use the brand image/logo specified in chaiseConfig', function() {
        var actualLogo = element(by.id('brand-image'));
        let expectedLogo = chaiseConfig.navbarBrandImage;
        expect(actualLogo.isDisplayed()).toBeTruthy();
        expect(actualLogo.getAttribute('src')).toMatch(expectedLogo);
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

    // TODO: 
    // it('for the menu, should generate the correct # of list items based on acls to show/hide specific options', function() {
    //     var nodesInDOM = menu.all(by.tagName('li'));
    //     // Count the number of nodes that are being shown (top level and submenus)
    //     //   - Local: config has 13 but 1 is hidden by ACLs
    //     //   - CI: config has 13 but 7 are hidden based on ACLs
    //     var counter = (!process.env.CI ? 12 : 6); // counted from chaise config doc rather than having code count

    //     nodesInDOM.count().then(function(count) {
    //         expect(count).toEqual(counter, "number of nodes present does not match what's defined in chaise-config");
    //     });
    // });

    it('should prefer markdownName over name when both are defined', function () {
        // option #2 has both name and markdownName defined
        let secondMenuItem = menu.all(by.css('div.nav-item'));
        expect(secondMenuItem.get(0).getText()).toBe("Test Recordsets", "name was used instead of markdownName");
    });

    it('should render a markdown pattern using proper HTML', function () {
        // in ci we don't have the same globus groups so the "show" ACL hides the 3rd link ("Records")
        var idx = (!process.env.CI ? 3 : 2);
        // option #4 has only markdownName defined
        let lastMenuItem = menu.all(by.css('div.nav-item')).get(1);
        lastMenuItem.element(by.css('a')).getAttribute('innerHTML').then(function (aInnerHTML) {
            expect(aInnerHTML.indexOf("<strong>")).toBeGreaterThan(-1, "name was used instead of markdownName");
        });
    });

    if (!process.env.CI) {
        var menuDropdowns, disabledSubMenuOptions;
        
        it("should have 4 top level dropdown menus", function() {
            expect(menu.all(by.css('.nav-link')).count()).toBe(4, "number of top level dropdown menus is wrong");
        });

        it('should have a disabled "Records" link.', function () {
            // get index 2 (3rd item)
            expect(menu.element(by.css("a.disable-link")).getText()).toBe("Records", "text is incorrect, may include caret");            
        });

        it('should have a header and a disabled "Edit Existing Record" submenu link (no children).', function () {
            //menu should still be open from previous test case
            let editMenu = menu.all(by.css('.nav-item')).get(1);
            editMenu.click().then(function() {
                expect(editMenu.all(by.css('.chaise-dropdown-header')).get(0).getText()).toBe("For Mutating Data", "Sub menu header is incorrect or not showing");
                return editMenu.all(by.css("a.disable-link"));
            }).then(function (options) {
                disabledSubMenuOptions = options;
                expect(options.length).toBe(4, "some options are not shown properly");
                expect(disabledSubMenuOptions[0].getText()).toBe("Edit Existing Record", "the wrong link is disabled or none were selected");
            });
        });

        it('should have disabled "Edit Records" submenu link (has children)', function () {
            //menu should still be open from previous test case
            expect(disabledSubMenuOptions[1].getText()).toBe("Edit Records", "the wrong link is disabled or caret is still visible");
        });
    }

    it('should show the "Full Name" of the logged in user in the top right', function () {
        var name = (!process.env.CI ? browser.params.client.full_name : browser.params.client.display_name);
        expect(element(by.css('.username-display')).getText()).toBe(name, "user's displayed name is incorrect");
    });


    it('should open the profile card on click of My Profile link', function(done) {
        var link = element(by.css('.username-display'));

        link.click();
        let profileLink = element(by.css('#profile-link'));
        profileLink.click();
        let modalContent = element(by.css('.profile-popup'));
        chaisePage.waitForElement(modalContent);
        expect(modalContent.isDisplayed()).toBeTruthy();
        done();
    });

    it('should close the profile card on click of X on the modal window', function(done) {
         var closeLink = element(by.css('.modal-close'));
         var modalContent = element(by.css('.modal-content'));

        //  PENDING: TimeoutError: Wait timed out after 15058ms
         chaisePage.clickButton(closeLink).then(function(){
            browser.wait(EC.not(EC.presenceOf(modalContent)), browser.params.defaultTimeout);
            expect(modalContent.isPresent()).toEqual(false);
            done();
        }).catch(function (err) {
            console.log(err);
            done.fail();
        });
    });

    // TODO: These tests are xit'd because we don't handle tests logging in via Globus/other services just yet
    // e.g. On CI, the user is logged in. On local machines, you must log in manually, which changes the desired order of specs.
    xit('should have a "Log In" link', function() {
        var actualLink = element(by.id('login-link'));
        browser.wait(EC.elementToBeClickable(actualLink), browser.params.defaultTimeout).then(function() {
            expect(actualLink.isDisplayed()).toBeTruthy();
        });
    }).pend("Pending until we handle tests logging in via Globus/other services");

    xit('should have a "Sign Up" link with the right href from chaiseConfig', function(done) {
        var actualLink = element(by.id('signup-link'));
        browser.wait(EC.elementToBeClickable(actualLink), browser.params.defaultTimeout).then(function() {
            expect(actualLink.isDisplayed()).toBeTruthy();
            expect(actualLink.getAttribute('href')).toMatch(chaiseConfig.signUpURL);
            done();
        });
    }).pend("Pending until we handle tests logging in via Globus/other services");

    xit('should display a "Log Out" link', function(done) {
        var logOutLink = element(by.id('logout-link'));
        browser.wait(EC.elementToBeClickable(logOutLink), browser.params.defaultTimeout).then(function() {
            browser.ignoreSynchronization = true;
            expect(logOutLink.isDisplayed()).toBeTruthy();
            done();
        });
    }).pend("Pending until we handle tests logging in via Globus/other services");
});
