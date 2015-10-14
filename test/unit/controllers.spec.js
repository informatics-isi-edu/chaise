var expect = require('chai').expect;

describe('Sidebar controller', function() {
  beforeEach(angular.mock.module('ermrestApp'));
  it('should pass', function() {
    expect(0).to.be.equal(0);
  });
});

describe('Service: facetsService', function() {
  beforeEach(angular.mock.module('facetsService'));

  var FacetsService;
  var $sce;
  var FacetsData;

  beforeEach(inject(function(_FacetsService_, _$sce_, _FacetsData_) {
    FacetsService = _FacetsService_;
    $sce = _$sce_;
    FacetsData = _FacetsData_;
  }));

  describe('Method: test', function() {
    it('should pass', function() {
      expect(0).to.be.equal(0);
    });
  });
});
