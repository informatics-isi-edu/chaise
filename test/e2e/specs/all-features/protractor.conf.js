var pConfig = require('./../../utils/protractor.configuration.js');

var config = pConfig.getConfig({
    // This config is meant to be run as part of the parallel tests configuration
    configFileName: 'parallel-configs/all-features.dev.json',
    specs: [
        // "*/*.spec.js"
        "acls/dynamic-acl.spec.js",
        // "acls/static-acl.spec.js",
        // "navbar/base-config.spec.js",
        // "record/copy-btn.spec.js",
        "record/related-table.spec.js", // should be moved down 1 for accurate order
        // "record/permissions-annotation.spec.js",
        // "recordedit/permissions-annotation.spec.js",
        // "recordset/permissions-annotation.spec.js",
    ],
    setBaseUrl: function(browser, data) {
        browser.params.url = process.env.CHAISE_BASE_URL;
        return browser.params.url;
    },
    chaiseConfigFilePath: 'test/e2e/specs/all-features/chaise-config.js'
});

exports.config = config;
