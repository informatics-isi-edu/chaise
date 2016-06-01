var expect = require('chai').expect;

describe('Utility: URLEnconding', function() {

  beforeEach(angular.mock.module('chaise.utils'));
  var UriUtils;
  beforeEach(inject(function(_UriUtils_) {
    UriUtils = _UriUtils_;
  }));

  it ("Utils should have fixedEncodeURIComponent function", function() {
    var isValid = (UriUtils && UriUtils.fixedEncodeURIComponent) ? true : false;
    expect(isValid).to.be.equal(true);
  });

  var urlCombinations = [{
    title: "should encode special characters (! * ' ( ) ; : @ & = + $ , / ? % [ ]) and ignore alphabets, numbers and '-', '_', '~', '/'",
    value: "mailto:info_bot@example.com?body=send \'current-issue\' !&product=2*3&division=10/5&addition=2+2&money=$30&percent=%20&reg=[~/();,'']",
    output: "mailto%3Ainfo_bot%40example.com%3Fbody%3Dsend%20%27current-issue%27%20%21%26product%3D2%2A3%26division%3D10%2F5%26addition%3D2%2B2%26money%3D%2430%26percent%3D%2520%26reg%3D%5B~%2F%28%29%3B%2C%27%27%5D",
    assertion: false
  }, {
    title: "should encode unicode characters ",
    value: "ǝlqɐʇsome ɐɯǝɥɔs ǝɯɐu",
    output: "%C7%9Dlq%C9%90%CA%87some%20%C9%90%C9%AF%C7%9D%C9%A5%C9%94s%20%C7%9D%C9%AF%C9%90u",
    assertion: false
  }, {
    title: "should encode unicode characters as well as special characters with words",
    value: "ǝlqɐʇsome'weirec,hara();cters']",
    output: "%C7%9Dlq%C9%90%CA%87some%27weirec%2Chara%28%29%3Bcters%27%5D",
    assertion: false
  }];

  urlCombinations.forEach(function(urlC) {
    it (urlC.title, function() {
      
        var output = UriUtils.fixedEncodeURIComponent(urlC.value);
        expect(/[!'()*]/.test(output)).to.be.equal(urlC.assertion);
        expect(output).to.be.equal(urlC.output);
      
        var output = decodeURIComponent(output);
        expect(output).to.be.equal(urlC.value);
      
    });
  });
});