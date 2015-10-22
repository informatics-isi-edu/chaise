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
    showColors: true,
    defaultTimeoutInterval: 30000
  },
  baseUrl: 'http://dev.facebase.org/data/record'
};
