var ermrestUtils = require("ermrest-data-utils");
var Q = require('q'); 

// Fetches the schemas for the current catalog
// The schema could be a new one or existing one depending on the test configuration
// Takes a callback function as an argument to be called on success
var fetchSchemas = function(testConfiguration, catalogId) {
    // Default to 1 if catalogId is undefined or null
    var catalogId = catalogId || 1, catalog, defaultSchema, defaultTable, defer = Q.defer();
    var done = false;
      
    // Fetches the schemas for the catalogId
    // and sets the defaultSchema and defaultTable in browser parameters
    ermrestUtils.introspect({
        url: process.env.ERMREST_URL,
        catalogId: catalogId || 1,
        authCookie: testConfiguration.authCookie
    }).then(function(schema) {
        if (testConfiguration.setup && testConfiguration.setup.schema) {
            schema = schema.catalog.schemas[testConfiguration.setup.schema] || schema;
        }
        catalog = schema.catalog;
        defaultSchema = schema;
        defaultTable = schema.defaultTable;
        // Set done to true to mention that the execution is over
        done = true;
    }, function(err) {
        console.log("Unable to fetch schemas");
        defer.reject(err);
    });

    // Wait until the value of done is true
    browser.wait(function() {
        return done;
    }, 5000).then(function() {
        defer.resolve({ schema: defaultSchema, catalogId: catalogId, catalog: catalog, defaultSchema: defaultSchema, defaultTable: defaultTable }); 
    }, function(err) {
        console.log("Import out 5000");
        err.catalogId = catalogId;
        defer.reject(err);
    });

    return defer.promise;
};
exports.fetchSchemas = fetchSchemas;

var importSchemas = function(configs, defer, authCookie, catalogId) {
    
    if (configs.length == 0) {
        defer.resolve(catalogId);
        return;
    }

    var config = configs.shift();

    if (catalogId) config.catalog.id = catalogId;
    else delete config.catalog.id;
    
    ermrestUtils.importData({
        setup: config,
        url: process.env.ERMREST_URL,
        authCookie: authCookie
    }).then(function (data) {
        process.env.catalogId = data.catalogId;
        importSchemas(configs, defer, authCookie, data.catalogId);
    }, function (err) {
        defer.reject(err);
    }).catch(function(err) {
        console.log(err);
        defer.reject(err);
    });
};

exports.importSchemas = function(schemaConfigurations, catalogId) {
    var defer = q.defer();
    importSchemas(schemaConfigurations.slice(0), defer, catalogId);
    return defer.promise;
};

exports.setup = function(testConfiguration) {

    var defer = Q.defer();

    var schemaConfigurations = testConfiguration.setup.schemaConfigurations;

    if (!schemaConfigurations || schemaConfigurations.length == 0) throw new Error("No schemaConfiguration provided in testConfiguration.setup.");

    var setupDone = false, successful = false, catalogId;

    var defer1 = Q.defer();
    // Call setup to import data for tests as specified in the configuration    
    importSchemas(schemaConfigurations.slice(0), defer1, testConfiguration.authCookie);
    
    defer1.promise.then(function(catId) {
    
        // Set catalogId in browser params for future reference to delete it if required
        catalogId = catId;

        // Set successful to determine data import was done successfully
        successful = true;

        // Set setupDone to true to specify that the setup code has completed its execution
        setupDone = true;
    }, function(err) {

        // Set catalogId in browser params for future reference to delete if it required
        catalogId = err.catalogId || null; 

        // Set setupDone to true to specify that the setup code has completed its execution
        setupDone = true;
    });

    // Wait until setupDone value is true
    browser.wait(function() {
        return setupDone;
    }, 120000).then(function() {
        // If data import was successful then fetch the schema definitions for the catalog
        // and set the default Schema and default Table in browser parameters
        if (successful) {
            exports.fetchSchemas(testConfiguration, catalogId).then(function(data) {
                defer.resolve(data);
            }, function(err) {
                defer.reject({ catalogId: catalogId });
            });
        } else {
            defer.reject({ catalogId: catalogId });
        }
    }, function(err) {
        console.log("I timed out in 12000");
        err.catalogId = catalogId;
        defer.reject(err);
    });

    return defer.promise;
};


exports.tear = function(testConfiguration, catalogId, defer) {
    var cleanupDone = false, defer = Q.defer();

    testConfiguration.setup.url = process.env.ERMREST_URL;        

    ermrestUtils.tear({
      url: process.env.ERMREST_URL,
      catalogId: catalogId,
      setup: testConfiguration.setup.schemaConfigurations[0]
    }).done(function() {
      cleanupDone = true;
    });

    browser.wait(function() {
      return cleanupDone;
    }, 5000).then(function() {
        defer.resolve();
    }, function(err) {
        defer.reject(err);
    });

    return defer.promise;
};