exports.config = {
  sauceUser: process.env.SAUCE_USERNAME,
  sauceKey: process.env.SAUCE_ACCESS_KEY,
  framework: 'jasmine2',
  capabilities: {
    browserName: 'firefox'
  },
  specs: [
    '*.spec.js'
  ],
  jasmineNodeOpts: {
    showColors: true
  },
  // If ng-app attribute is in a descendant <body>, tell Protractor where ng-app is
  rootElement: '#loginApp',
  baseUrl: 'http://dev.facebase.org'
};
