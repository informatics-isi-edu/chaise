var pConfig = require('./../../utils/protractor.configuration.js');

var config = pConfig.getConfig({
    // This config is meant to be run as part of the parallel tests configuration
    configFileName: 'parallel-configs/all-features-confirmation.dev.json',
    specs: [
        // "*/*.spec.js"
        "footer/footer.spec.js",
        "record/create-btn.spec.js",
        "navbar/no-logo.spec.js",
        "record/edit-btn.spec.js",
        "record/delete-btn.spec.js",
        "errors/errors.spec.js",
        "record/presentation.spec.js",
        "recordset/presentation.spec.js",
        // "recordedit/edit.spec.js",
        // "recordedit/add.spec.js",
    ],
    setBaseUrl: function(browser, data) {
        browser.params.url = process.env.CHAISE_BASE_URL;
        return browser.params.url;
    },
    chaiseConfigFilePath: 'test/e2e/specs/all-features-confirmation/chaise-config.js'
});

exports.config = config;
