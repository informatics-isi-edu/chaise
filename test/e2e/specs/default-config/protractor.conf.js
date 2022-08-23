var pConfig = require('./../../utils/protractor.configuration.js');

var config = pConfig.getConfig({
    // This config is meant to be run as part of the parallel tests configuration
    configFileName: 'parallel-configs/default-config.dev.json',
    specs: [
        // "*/*.spec.js"
        "record/links.spec.js",
        "recordedit/add-x-forms.spec.js",
        "recordedit/immutable-inputs.spec.js",
        "recordedit/domain-filter.spec.js",
        "recordedit/remove-edit-form.spec.js",
        "recordedit/submission-disabled.spec.js"
    ],
    setBaseUrl: function(browser, data) {
        browser.params.url = process.env.CHAISE_BASE_URL;
        return browser.params.url;
    },
    chaiseConfigFilePath: 'test/e2e/specs/default-config/chaise-config.js'
});

exports.config = config;
