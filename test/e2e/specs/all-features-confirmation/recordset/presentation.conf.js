var pConfig = require("./../../../utils/protractor.configuration.js");

var config = pConfig.getConfig({
  configFileName: "recordset/dev.json",
  specs: ["presentation.spec.js"],
  setBaseUrl: function (browser, data) {
    browser.params.url = process.env.CHAISE_BASE_URL;
    return browser.params.url;
  },
  chaiseConfigFilePath:
    "test/e2e/specs/all-features-confirmation/chaise-config.js",

    // Below config is used to test download feature without having to show prompt 
    // to select the local PC download location.
  capabilities: {
    browserName: "chrome",
    proxy: {
      proxyType: "manual",
    },
    count: 1,
    shardTestFiles: false,
    maxInstances: 1,
    chromeOptions: {
      args: ["--no-sandbox", "--test-type=browser"],
      // Set download path and avoid prompting for download even though
      // this is already the default on Chrome but for completeness
      prefs: {
        download: {
          prompt_for_download: false,
          directory_upgrade: true,
          default_directory: "/",
        },
      },
    },
  },
});

exports.config = config;
