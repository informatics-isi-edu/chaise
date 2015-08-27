// Sample Test with Mocha and Chai

var expect = require('chai').expect
  , foo = 'bar'
  , beverages = { tea: [ 'chai', 'matcha', 'oolong' ] };

describe('sample-test', function() {
  it('should pass', function() {
    expect(foo).to.be.a('string');
    expect(foo).to.equal('bar');
    expect(foo).to.have.length(3);
    expect(beverages).to.have.property('tea').with.length(3);
  });
});
