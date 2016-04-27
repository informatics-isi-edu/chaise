exports.config = {
  sauceUser: process.env.SAUCE_USERNAME,
  sauceKey: process.env.SAUCE_ACCESS_KEY,
  framework: 'jasmine2',
  capabilities: {
    browserName: 'chrome'
  },
  //multiCapabilities: [{
  //  'browserName': 'firefox'
  //}, {
  //  'browserName': 'chrome'
  //}],
  specs: [
    '*.spec.js'
  ],
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000
  },
  // If ng-app attribute is in a descendant of <body>, tell Protractor where ng-app is
  rootElement: '#main-content',
  // CHAISE_BASE_URL should be https://dev.misd.isi.edu/chaise for now.
  baseUrl: process.env.CHAISE_BASE_URL + '/search'

  // CHAISE_BASE_URL should be https://dev.misd.isi.edu/chaise for now.
  //baseUrl: process.env.CHAISE_BASE_URL + '/data/record'
};
