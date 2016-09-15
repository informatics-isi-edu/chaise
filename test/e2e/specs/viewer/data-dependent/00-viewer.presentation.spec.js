describe('Viewer app', function() {
    it('should load custom CSS and document title defined in chaise-config.js', function() {
        var chaiseConfig = browser.executeScript('return chaiseConfig');
        if (chaiseConfig.customCSS) {
            expect($("link[href='" + chaiseConfig.customCSS + "']").length).toBeTruthy();
        }
        if (chaiseConfig.headTitle) {
            browser.getTitle().then(function(title) {
                expect(title).toEqual(chaiseConfig.headTitle);
            });
        }
    });
});
