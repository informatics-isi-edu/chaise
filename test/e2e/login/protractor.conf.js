exports.config = {
  framework: 'jasmine2',
  seleniumAddress: 'http://localhost:4444/wd/hub',
  capabilities: {
    browserName: 'firefox'
  },
  specs: [
    '*.spec.js'
  ],
  jasmineNodeOpts: {
    showColors: true
  },
  // If ng-app isn't an attribute on <body>, tell Protractor where ng-app is
  rootElement: '#loginApp',
  baseUrl: 'http://dev.facebase.org'
};
