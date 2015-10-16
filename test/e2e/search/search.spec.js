// Each suite should begin with a `describe`
describe('In the Chaise search app,', function() {
  beforeAll(function() {
    browser.get('');
  });
  describe('on load,', function() {
    it('should show the spinner', function() {
      var spinner = element(by.id('spinner'));
      expect(spinner.isDisplayed()).toBe(true);
    });
    it('should open the initial sidebar', function() {
      setTimeout(function() {
        var sidebar = element(by.id('sidebar'));
        expect(sidebar.isDisplayed()).toBeTruthy();
        console.log('Do nothing');
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

  // describe('the initial facet selection sidebar', function() {
  //   // Find a DOM element by its ng-model
  //   var searchBox = element(by.model('FacetsData.searchFilter'));
  //   it('should find > 1 attributes when searching for "Yang"', function() {
  //     expect(searchBox.isPresent()).toBe(true);
  //     // Set values via sendKeys();
  //     searchBox.sendKeys('Yang');
  //     // var attributes = element(by.)
  //     // expect();
  //   });
  //   it('should find 0 attributes when searching for "1k23kjh3kl22lkj5jfsd"', function() {
  //     expect(1).toEqual(1);
  //   });
  //   it('should reflect the current search results in initial sidebar heading', function() {
  //     expect(1).toEqual(1);
  //   });
  // });



});
