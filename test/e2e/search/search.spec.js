// Each suite should begin with a `describe`
describe('In the Chaise search app,', function() {
  describe('on load,', function() {
    beforeAll(function() {
      browser.get('');
    });
    it('should show the spinner', function() {
      var spinner = element(by.id('spinner'));
      expect(spinner.isDisplayed()).toBe(true);
    });
    it('should open the initial sidebar', function() {
      setTimeout(function() {
        var sidebar = element(by.id('sidebar'));
        expect(sidebar.isDisplayed()).toBeTruthy();
      }, 800);
    });
    it('should have > 1 visible facets to choose from', function() {
      // Find elements by ng-repeat
      var facets = element.all(by.repeater('facet in FacetsData.facets'));
      expect(facets.count()).toBeGreaterThan(0);
      var hiddenFacets = element.all(by.css('#sidebar ul.sidebar-nav li.ng-hide'));
      expect(hiddenFacets.count()).toBeLessThan(facets.count());
    });
  });

  describe('the initial facet selection sidebar', function() {
    var searchBox;
    beforeAll(function() {
      browser.get('');
      // Find elements by ng-model
      searchBox = element(by.model('FacetsData.searchFilter'));
    });
    it('should find > 1 attributes when searching for something that exists in db', function() {
      setTimeout(function() {
        expect(searchBox.isPresent()).toBe(true);
        // Set values (usually inputs) via sendKeys();
        searchBox.sendKeys('Yang');
        var facets = element.all(by.repeater('facet in FacetsData.facets'));
        var hiddenFacets = element.all(by.css('#sidebar ul.sidebar-nav li.ng-hide'));
        var numVisibleFacets = facets.count()-hiddenFacets.count();
        expect(numVisibleFacets).toBeGreaterThan(0);
      }, 800);
    });
  });
});
