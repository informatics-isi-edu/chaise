//var ermrestUtils = require("ermrest-data-utils");

var ermrestUtils = require(process.env.PWD + "/../ErmrestDataUtils/import.js");
var Q = require('q');
var http = require('request-q');

//**********************************************************************
// function waitfor - Wait until a condition is met
//
// Needed parameters:
//    test: function that returns a value
//    expectedValue: the value of the test function we are waiting for
//    msec: delay between the calls to test
//    callback: function to execute when the condition is met
// Parameters for debugging:
//    count: used to count the loops
//    source: a string to specify an ID, a message, etc
//**********************************************************************
function waitfor(test, timer, end, defer) {
    // Check if condition met. If not, re-check later (msec).
    if (!test()) {
        if (timer > end) {
            defer.reject(new Error("Timer timed out"));
        } else {
            setTimeout(function() {
                timer = timer + 50;
                waitfor(test, timer, end, defer);
            }, 50);
        }
        return;
    }
    // Condition finally met. callback() can be executed.
    defer.resolve();
}

function wait(condition, msec) {
    var defer = Q.defer();

    var timer = new Date().getTime();
    var end = timer + msec;

    waitfor(condition, timer, end, defer);

    return defer.promise;
}

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
    wait(function() {
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

var importSchemas = function(configs, defer, authCookie, catalogId, entities) {

    if (configs.length == 0) {
        defer.resolve({catalogId: catalogId, entities: entities});
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
        if (data.schema) {
            entities[data.schema.name] = {};
            for (var t in data.schema.tables) {
                if (!data.schema.tables.hasOwnProperty(t)) continue;
                entities[data.schema.name][t] = data.schema.tables[t].entities;
            }
            console.log("Attached entities of " + data.schema.name + " schema");
        }
        importSchemas(configs, defer, authCookie, data.catalogId, entities);
    }, function (err) {
        defer.reject(err);
    }).catch(function(err) {
        console.log(err);
        defer.reject(err);
    });
};

/**
 * Will send a request to create all the given schemas at once. It will take
 * care of changing the configs to be what the function in ErmrestDataUtils accepts.
 * It will not return anything, but will reject or resolve the given defer object.
 *
 * NOTE the catalogId that is passed is not used in this function, I wanted to follow
 * the same pattern as the existing function, but we can completely remove that.
 * We're always create a new catalog in here. We're not reusing the same catalog.
 *
 * @param  {object} configs    the schema configurations
 * @param  {object} defer      the defer object
 * @param  {string} authCookie the webauthn cookie
 * @param  {string} catalogId  catalog id
 * @param  {object} entities   the container for the entities
 */
var bulkImportSchemas = function(configs, defer, authCookie, catalogId, entities) {
    var catalog = {},
        schemas = {};

    var config, schema, schemaName;

    if (!configs || configs.length === 0) {
        return defer.resolve({catalogId: catalogId, entities: {}}), defer.promise;
    }

    // create the settings based on the acceptable strucutre.
    // please refer to ermest data utils documentation for the strucutre
    var settings = {
        url: process.env.ERMREST_URL,
        authCookie: authCookie
    };

    configs.forEach(function (config) {
        // copy annotations and ACLs over to the submitted catalog object
        if (config.catalog && typeof config.catalog === "object") {
            // if empty object, this loop is skipped
            for (var prop in config.catalog) {
                // if property is set already
                if (catalog[prop]) {
                    console.log(prop + " is already defined on catalog object, overriding previously set value with new one")
                }
                catalog[prop] = config.catalog[prop];
            }
        }

        schemas[config.schema.name] = {
            path: config.schema.path
        };

        if (config.entities) {
            schemas[config.schema.name].entities = config.entities.path;
        }
    });

    // honoring the catalog object now, anything defined in it will be passed to ErmrestDataUtils
    settings.setup = {catalog: catalog, schemas: schemas};

    // reuse the same catalogid
    if (catalogId) settings.setup.catalog.id = catalogId;
    
    console.log("making sure ermrest can be accessible")
    http.get(process.env.ERMREST_URL).then(function (res) {
        console.log("ermrest is installed:");
        console.log(res);
        return ermrestUtils.createSchemasAndEntities(settings);
    }).then(function (data) {
        process.env.catalogId = data.catalogId;
        if (data.schemas) {
            for(schemaName in data.schemas) {
                if (!data.schemas.hasOwnProperty(schemaName)) continue;

                schema = data.schemas[schemaName];
                entities[schema.name] = {};

                for (var t in schema.tables) {
                    if (!schema.tables.hasOwnProperty(t)) continue;

                    entities[schema.name][t] = schema.tables[t].entities;
                }
            }
            console.log("Attached entities for the schemas");
        }
        defer.resolve({entities: entities, catalogId: data.catalogId});
    }).catch(function (err) {
        console.log("error while trying to create model and data:");
        console.log(err);
        defer.reject(err);
    });
};

exports.setup = function(testConfiguration) {

    var defer = Q.defer();

    var schemaConfigurations = testConfiguration.setup.schemaConfigurations;

    if (!schemaConfigurations || schemaConfigurations.length == 0) throw new Error("No schemaConfiguration provided in testConfiguration.setup.");

    var setupDone = false, successful = false, catalogId, entities = {};

    var defer1 = Q.defer();
    // Call setup to import data for tests as specified in the configuration
    bulkImportSchemas(schemaConfigurations, defer1, testConfiguration.authCookie, undefined, entities);

    defer1.promise.then(function(res) {

        // Set catalogId in browser params for future reference to delete it if required
        catalogId = res.catalogId;

        // Set the entities object will contain the entities
        entities = res.entities;

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
    wait(function() {
        return setupDone;
    }, 120000).then(function() {
        // If data import was successful then fetch the schema definitions for the catalog
        // and set the default Schema and default Table in browser parameters
        if (successful) {
            exports.fetchSchemas(testConfiguration, catalogId).then(function(data) {
                data.entities = entities;
                defer.resolve(data);
            }, function(err) {
                defer.reject({ catalogId: catalogId });
            });
        } else {
            defer.reject({ catalogId: catalogId });
        }
    }, function(err) {
        console.log("I timed out in 120000");
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
      setup: testConfiguration.setup.schemaConfigurations[0],
      authCookie: process.env.AUTH_COOKIE
    }).done(function() {
      cleanupDone = true;
    });

    wait(function() {
      return cleanupDone;
    }, 5000).then(function() {
        defer.resolve();
    }, function(err) {
        defer.reject(err);
    });

    return defer.promise;
};

/**
 * Delete the given list of namespaces
 * @param  {String} authCookie webauthn cookie
 * @param  {String[]} namespaces Array of namespaces. They must be absolute path.
 */
exports.deleteHatracNamespaces = function (authCookie, namespaces) {
    var promises = [];
    http.setDefaults({headers: {'Cookie': authCookie}});
    namespaces.forEach(function (ns) {
        var defer = Q.defer();

        http.delete(ns).then(function() {
            console.log("namespace " + ns + " deleted from hatrac.");
            defer.resolve();
        }, function (error) {
            console.log("namespace " + ns + " could not be deleted.");
            console.log(error)
            defer.reject(error);
        });

        promises.push(defer.promise);
    });

    return Q.all(promises);
}
