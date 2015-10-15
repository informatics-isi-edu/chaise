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
  baseUrl: 'http://dev.facebase.org/data/record'
};
