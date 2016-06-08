exports.config = {
  sauceUser: process.env.SAUCE_USERNAME,
  sauceKey: process.env.SAUCE_ACCESS_KEY,
  framework: 'jasmine2',
  capabilities: {
    browserName: 'chrome',
    'chromeOptions' : {
       args: ['--lang=en',
              '--window-size=1280,1024']
    }
  },
  specs: [
    'login.spec.js'
  ],
  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000
  },
  // If ng-app attribute is in a descendant <body>, tell Protractor where ng-app is
  rootElement: '#loginApp',
  //rootElement: '#main-content',
  baseUrl: process.env.CHAISE_BASE_URL
};
