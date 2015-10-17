exports.config = {
  framework: 'jasmine2',
  seleniumAddress: 'http://localhost:4444/wd/hub',
  capabilities: {
    browserName: 'firefox',
  },
  specs: [
    '*.spec.js'
  ],
  jasmineNodeOpts: {
    showColors: true
  },
  // If ng-app attribute is in a descendant of <body>, tell Protractor where ng-app is
  rootElement: '#main-content',
  baseUrl: 'http://dev.facebase.org/data/search'
};
