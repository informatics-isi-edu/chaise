var pConfig = require('./../../../utils/protractor.configuration.js');

var config = pConfig.getConfig({
    configFileName: 'viewer/dev.json',
    setBaseUrl: function(browser, data) {
        browser.params.url = process.env.CHAISE_BASE_URL;
        return browser.params.url;
    }

});

exports.config = config;
