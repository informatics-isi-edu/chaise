var Q = require("q");
var fs = require("fs");

exports.parameterize = function(config, configParams) {

    if ((typeof configParams != 'object')) {
        throw new Error("Invalid testConfiguration path provided for protractor parameterization in protractor config");
    }

    var testConfiguration = configParams.testConfiguration || {};

    testConfiguration.authCookie = process.env.AUTH_COOKIE;
    var pImport = require('../utils/protractor.import.js');

    var catalogId = null,
        Q = require('q');

    // This is where we're writing the entities to.
    // There are some system generated columns that we might want to know the value of,
    // entities will have those. The problem is that we cannot just attach this variable
    // to `global` since we might run test specs in multiple threads via sharding.
    // Therefore we are writing these data this file, and then removing the file
    var entities_path = "entities.json";

    var launchPromise;

    if (process.env.CI) {
        console.log("In CI");
        config.sauceUser = process.env.SAUCE_USERNAME;
        config.sauceKey = process.env.SAUCE_ACCESS_KEY;
        config.capabilities['tunnel-identifier'] = process.env.SAUCE_TUNNEL_IDENTIFIER;
        config.capabilities['build'] = process.env.GITHUB_RUN_ID;
        config.capabilities['name'] = process.env.GITHUB_WORKFLOW;
    }

    var onErmrestLogin = function(defer) {
        testConfiguration.setup.url = process.env.ERMREST_URL;
        testConfiguration.setup.authCookie = testConfiguration.authCookie;

        pImport.setup(testConfiguration).then(function(data) {
            process.env.CATALOGID = data.catalogId;
            if (data.entities) {
                entities = data.entities;
                fs.writeFile(entities_path, JSON.stringify(entities), 'utf8', function(err) {
                    if (err) {
                        console.log("couldn't write entities.");
                        console.log(err);
                        defer.reject(new Error("Unable to import data"));
                    } else {
                        console.log("created entities file for schemas");
                        defer.resolve();
                    }
                });

            } else {
                defer.resolve();
            }

        }, function(err) {
            process.env.CATALOGID = catalogId = err.catalogId;
            console.log(err);
            defer.reject(new Error("Unable to import data"));
        });

    };

    /**
     *  send a request to authn with the given cookie and return the result, purposes:
     *  - set the `_ID` env variable so later can be used for tests.
     *  - get the client object
     */
    var getSessionByCookie = function (cookie, authCookieEnvName) {
        var defer = Q.defer();
        require('request')({
            url: process.env.ERMREST_URL.replace('ermrest', 'authn') + '/session',
            method: 'GET',
            headers: {
                'Cookie': cookie
            }
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var info = JSON.parse(body);
                process.env[authCookieEnvName + '_ID'] = info.client.id;
                console.log(authCookieEnvName + "_ID: ", info.client.id);

                defer.resolve(body);
            } else {
                defer.reject('Unable to retreive userinfo for ' + authCookieEnvName);
            }
        });
        return defer.promise;
    }

    /**
     *  send a request to authn with the given username and password and return the result, purposes:
     *  - set the `_ID` env variable so later can be used for tests.
     *  - get the client object
     */
    var getSessionByUserPass = function (username, password, authCookieEnvName) {
        var defer = Q.defer();

        require('request')({
            url: process.env.ERMREST_URL.replace('ermrest', 'authn') + '/session',
            method: 'POST',
            body: 'username=' + username + '&password=' + password
        }, function(error, response, body) {
            if (!error && response.statusCode == 200) {
                var cookies = require('set-cookie-parser').parse(response);
                cookies.forEach(function(c) {
                    // auth cookie env variable
                    if (c.name == "webauthn") {
                        if (authCookieEnvName == "AUTH_COOKIE") { // main user
                            testConfiguration.authCookie = c.name + "=" + c.value + ";";
                            // set the session information to be parsed later
                            process.env.WEBAUTHN_SESSION = body;
                        }
                        // webauthn cookie
                        process.env[authCookieEnvName] = c.name + '=' + c.value + ';';
                    }
                });

                if (process.env[authCookieEnvName]) {
                    // user id
                    var info = JSON.parse(body);
                    process.env[authCookieEnvName + '_ID'] = info.client.id;
                    defer.resolve();
                } else {
                    defer.reject('Unable to retreive ' + authCookieEnvName);
                }
            } else {
                console.dir('Unable to retreive ' + authCookieEnvName);
                defer.reject(error);
            }
        });

        return defer.promise;
    };

    config.beforeLaunch = function() {
        var defer = Q.defer();

        console.log("before launch");

        if (process.env.CI) {
            var exec = require('child_process').exec;
            exec("hostname", function(error, stdout, stderr) {

                process.env.ERMREST_URL = "http://" + stdout.trim() + "/ermrest";
                process.env.CHAISE_BASE_URL = "http://" + stdout.trim() + "/chaise";

                console.log("ERMrest url is " + process.env.ERMREST_URL);

                console.log("getting test1 user info");
                getSessionByUserPass('test1', 'dummypassword', 'AUTH_COOKIE').then(function () {
                    console.log("getting test2 user info");
                    return getSessionByUserPass('test2', 'dummypassword', 'RESTRICTED_AUTH_COOKIE');
                }).then(function () {

                    onErmrestLogin(defer);
                }).catch(function (err) {
                    defer.reject(err);
                })
            });
        } else {
            console.log("testing AUTH_COOKIE");
            getSessionByCookie(process.env.AUTH_COOKIE, "AUTH_COOKIE").then(function (res) {
                // set the session information to be parsed later
                process.env.WEBAUTHN_SESSION = res;

                console.log("testing RESTRICTED_AUTH_COOKIE");
                return getSessionByCookie(process.env.RESTRICTED_AUTH_COOKIE, "RESTRICTED_AUTH_COOKIE");
            }).then(function (res) {
                onErmrestLogin(defer);
            }).catch(function (err) {
                defe.reject(err);
            });
        }


        return defer.promise;
    };

    // This method will be called before starting to execute the test suite
    config.onPrepare = function() {

        var SpecReporter = require('jasmine-spec-reporter');
        // add jasmine spec reporter
        jasmine.getEnv().addReporter(new SpecReporter({
            displayStacktrace: 'all'
        }));

        browser.params.configuration = testConfiguration, defer = Q.defer();
        browser.params.client = JSON.parse(process.env.WEBAUTHN_SESSION).client;

        // Set catalogId in browser params for future reference to delete it if required
        browser.params.catalogId = catalogId = process.env.CATALOGID;

        if (process.env.AUTH_COOKIE) {
            testConfiguration.authCookie = process.env.AUTH_COOKIE;
        }

        pImport.fetchSchemas(testConfiguration, catalogId).then(function(data) {

            // Set schema returned in browser params for refering it in test cases
            browser.params.schema = data.defaultSchema;
            browser.params.catalog = data.catalog;
            browser.params.defaultSchema = data.defaultSchema;
            browser.params.defaultTable = data.defaultTable;
            browser.params.catalogId = data.catalogId;

            // read the entities from the file
            fs.readFile(entities_path, 'utf8', function(err, data) {
                if (err) {
                    console.log("couldn't read entities");
                    defer.reject({
                        catalogId: catalogId
                    });
                } else {
                    browser.params.entities = JSON.parse(data);
                }
            });

            // Set hatrac namespaces that should be deleted (test cases will add to this)
            testConfiguration.hatracNamespaces = [];

            // Set the base url to the page that we are running the tests for
            browser.baseUrl = process.env.CHAISE_BASE_URL;

            // set the url for testcases to start using the catalogId and schema that was mentioned in the configuration
            if (typeof configParams.setBaseUrl == 'function') configParams.setBaseUrl(browser, data);
            else browser.params.url = browser.baseUrl;

            browser.params.origin = process.env.ERMREST_URL.slice(0, process.env.ERMREST_URL.indexOf('/ermrest'));

            // Visit the default page and set the authorization cookie if required
            if (testConfiguration.authCookie) {
                console.log("setting up cookie");
                require('./chaise.page.js').performLogin(testConfiguration.authCookie, false, defer);
            } else {
                defer.resolve();
            }
        }, function(err) {
            defer.reject({
                catalogId: catalogId
            });
        }).catch(function(err) {
            console.log(err);
            defer.reject({
                catalogId: catalogId
            });
        });


        return defer.promise;
    };

    // This method will be called after executing the test suite
    config.afterLaunch = function(exitCode) {
        var promises = [];

        if (testConfiguration.hatracNamespaces && testConfiguration.hatracNamespaces.length > 0) {
            // cleanup the hatrac namespaces
            promises.push(pImport.deleteHatracNamespaces(testConfiguration.authCookie, testConfiguration.hatracNamespaces));
        }

        // If cleanup is true and setup was also true in the configuration then
        // call cleanup to remove the created schema/catalog/tables if catalogId is not null
        catalogId = process.env.CATALOGID;
        console.log("catalogId:" + catalogId);
        if (testConfiguration.cleanup && testConfiguration.setup && catalogId != null) {
            promises.push(pImport.tear(testConfiguration, catalogId));
        }

        // delete the entities file
        fs.unlinkSync(entities_path);

        return Q.all(promises);
    };

    // If an uncaught exception is caught then simply call cleanup
    // to remove the created schema/catalog/tables if catalogId is not null
    process.on('uncaughtException', function(err) {
        catalogId = process.env.CATALOGID;
        console.log("in error : catalogId " + catalogId);
        console.dir(err);
        var cb = function() {
            console.error((new Date).toUTCString() + ' uncaughtException:', err.message);
            console.error(err.stack);
            process.exit(1)
        };
        if (!process.catalogDeleted && testConfiguration.cleanup && testConfiguration.setup && catalogId != null) pImport.tear(testConfiguration, catalogId).then(cb, cb);
        else cb();

    });

    process.on('SIGINT', function(code) {
        catalogId = process.env.CATALOGID;
        if (!process.catalogDeleted) {
            process.catalogDeleted = true;
            console.log('About to exit because of SIGINT (ctrl + c)');
            pImport.tear(testConfiguration, catalogId).done(function() {
                process.exit(1);
            });
        } else {
            process.exit(1);
        }
    });

};
