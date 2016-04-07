(function() {
    'use strict';

    angular.module('chaise.dataEntry', [
        'ERMrest',
        'ngSanitize',
        'chaise.filters',
        'ui.select',
        'rzModule',
        '720kb.datepicker',
        'ngMessages'
    ])

    // Configure the context info from the URI
    .config(['context', function configureContext(context) {
        if (chaiseConfig.headTitle !== undefined) {
            document.getElementsByTagName('head')[0].getElementsByTagName('title')[0].innerHTML = chaiseConfig.headTitle;
        }

        context.serviceURL = window.location.origin + '/ermrest';
        if (chaiseConfig.ermrestLocation) {
            context.serviceURL = chaiseConfig.ermrestLocation + '/ermrest';
        }

        var hash = window.location.hash;

        if (hash === undefined || hash == '' || hash.length == 1) {
            return;
        }

        var parts = hash.substring(1).split('/');
        context.catalogID = parts[0];
        if (parts[1]) {
            var params = parts[1].split(':');
            if (params.length > 1) {
                context.schemaName = params[0];
                context.tableName = params[1];
            } else {
                context.schemaName = '';
                context.tableName = params[0];
            }
        }
    }])

    .run(['context', 'ermrestServerFactory', 'editorModel', '$http', function runApp(context, ermrestServerFactory, editorModel, $http) {
        var server = ermrestServerFactory.getServer(context.serviceURL);
        server.catalogs.get(context.catalogID).then(function success(catalog) {
            var schema = catalog.schemas.get(context.schemaName);
            if (schema) {
                var table = schema.tables.get(context.tableName);
                if (table) {
                    editorModel.table = table;
                    editorModel.cols = table.columns.all();

                    var foreignKeys = table.foreignKeys.all();
                    var foreignKeysLength = foreignKeys.length;
                    for (var i = 0; i < foreignKeysLength; i++) {
                        // Capture the i from the containing for loop in a closure
                        // so that getDomainValues() has the correct i on success
                        (function(i) {
                            var currentKey = foreignKeys[i];
                            currentKey.getDomainValues().then(function success(values) {
                                var valuesLength = values.length;
                                var domainValues = editorModel.domainValues[currentKey.colset.columns[0].name] = [];
                                for (var j = 0; j < valuesLength; j++) {
                                    var field = Object.keys(values[j])[0];
                                    domainValues.push(values[j][field]);
                                }
                            }, function error(response) {
                                console.log(response);
                            });
                        })(i);
                    }
                } else {
                    alert('Sorry, the requested table "' + context.tableName + '" was not found. Please check the URL and refresh the page.');
                    console.log('Table not found.');
                }
            } else {
                alert('Sorry, the requested schema "' + context.schemaName + '" was not found. Please check the URL and refresh the page');
                console.log('Schema not found.');
            }
        }, function error(response) {
            if (response.status == 401) {
                if (chaiseConfig.authnProvider == 'goauth') {
                    getGoauth(encodeSafeURIComponent(window.location.href));
                }
                console.log(response);
            }
        });

        function getGoauth(referrer) {
            var url = '/ermrest/authn/preauth?referrer=' + referrer;
            $http.get(url).then(function success(response) {
                window.open(response.data.redirect_url, '_self');
            }, function error(response) {
                console.log('Error: ', error);
            });
        }

        function encodeSafeURIComponent (str) {
            return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
                return '%' + c.charCodeAt(0).toString(16).toUpperCase();
            });
        }

    }]);

    // Refresh the page when the window's hash changes. Needed because Angular
    // normally doesn't refresh page when hash changes.
    window.onhashchange = function() {
        if (window.location.hash != '#undefined') {
            location.reload();
        } else {
            history.replaceState("", document.title, window.location.pathname);
            location.reload();
        }
        function goBack() {
            window.location.hash = window.location.lasthash[window.location.lasthash.length-1];
            window.location.lasthash.pop();
        }
    }
})();
