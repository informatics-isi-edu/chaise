// Sample Test with Mocha and Chai

var expect = require('chai').expect;

// describe('Array.prototype.contains', function() {
//   it('should return true when an array contains an element', function() {
//     expect(beverages)
//     expect(foo).to.be.a('string');
//     expect(foo).to.equal('bar');
//     expect(foo).to.have.length(3);
//     expect(beverages).to.have.property('tea').with.length(3);
//   });
// });

// describe('Sidebar', function() {
//   it('should have class .open on #sidebar on load', function() {
//     $(window).load = baseURL + '/search';
//     expect($('#sidebar')).to.exist();
//   });
// });

describe('chaiseConfig', function() {
  var fs = require('fs');
  var vm = require('vm');
  var config = fs.readFileSync('chaise-config.js');
  vm.runInThisContext(config);

  it('should have non-empty values for authnProvider, feedback URL, and help URL', function() {
    expect(chaiseConfig).to.have.property('authnProvider').to.be.a('string').with.length.above(0);
    expect(chaiseConfig).to.have.property('feedbackURL').to.be.a('string').with.length.above(0);
    expect(chaiseConfig).to.have.property('helpURL').to.be.a('string').with.length.above(0);
  });
});
