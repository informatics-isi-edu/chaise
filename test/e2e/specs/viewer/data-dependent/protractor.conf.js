var pConfig = require('./../../../utils/protractor.configuration.js');

var config = pConfig.getConfig({

    // Change this to your desired filed name and Comment below testConfiguration object declaration
    // configFileName: 'viewer.dev.json',

    /* Just in case if you plan on not giving a file for configuration, you can always specify a testConfiguration object
     * Comment above 2 lines
     * Empty configuration will run test cases against catalog 1 and default schema
     */
     testConfiguration: {},


    /* If you want to set a custom base URL with some query string or other url parameters use
     * setBaseUrl function else directly set the page. You just need to provide wither of them.
     */
    page: '/viewer',


    setBaseUrl: function(browser, data) {
        browser.params.url = process.env.CHAISE_BASE_URL + "/viewer" + "/#" + data.catalogId + "/" + data.schema.name;
        return browser.params.url;
    }

});

exports.config = config;
