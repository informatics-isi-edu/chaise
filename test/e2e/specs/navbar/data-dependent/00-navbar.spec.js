describe('Navbar ', function() {
    var navbar, EC = protractor.ExpectedConditions;

    beforeAll(function() {
        navbar = $('#mainnav');
        browser.wait(EC.presenceOf(navbar), 5000);
    });

    it('should be visible', function() {
        expect(navbar.isDisplayed()).toBeTruthy();
        expect(1).toBe(1);
    });
});
