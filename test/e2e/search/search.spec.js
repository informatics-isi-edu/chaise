// Each suite should begin with a `describe`
describe('In the Chaise search app,', function() {
  var EC = protractor.ExpectedConditions;
  describe('on load,', function() {
    beforeAll(function() {
      browser.get('');
    });
    it('should show the spinner', function(done) {
      var spinner = element(by.id('spinner'));
      // Browser waits (up to 500ms) for spinner to become visible before continuing
      browser.wait(EC.visibilityOf(spinner), 500).then(function() {
        expect(spinner.isDisplayed()).toBe(true);
      });
      done();
    });
    it('should open the initial sidebar', function(done) {
      var spinner = element(by.id('spinner'));
      var sidebar = element(by.id('sidebar'));
      browser.wait(EC.visibilityOf(sidebar), 5000).then(function() {
        expect(sidebar.isDisplayed()).toBe(true);
        expect(spinner.isDisplayed()).toBe(false);
      });
      done();
    });
    it('should have > 1 visible facets to choose from', function(done) {
      var facets = element.all(by.css('#sidebar ul.sidebar-nav li.ng-scope'));
      facets.then(function() {
        expect(facets.count()).toBeGreaterThan(0);
      });
      var hiddenFacets = element.all(by.css('#sidebar ul.sidebar-nav li.ng-scope.ng-hide'));
      hiddenFacets.then(function() {
        expect(hiddenFacets.count()).toBeLessThan(facets.count());
      });
      done();
    });
  });

  describe('the initial facet selection sidebar', function() {
    it('should display 0 attributes when searching for something nonexistent', function(done) {
      var searchBox = element(by.model('FacetsData.searchFilter'));
      browser.wait(EC.visibilityOf(searchBox), 500).then(function() {
        // Set values (usually inputs) via sendKeys();
        searchBox.sendKeys('a;sd324ljr5858@#$%^&*(+-+-8+lkfjalk234j2;l543587dglij4r543df;iqw3');
      });
      setTimeout(function() {
        var facets = element.all(by.css('#sidebar ul.sidebar-nav li.ng-scope')).then(function() {
          expect(facets.isDisplayed()).toBe(false);
        });
      }, 5000);
      done();
    });
  });
});
