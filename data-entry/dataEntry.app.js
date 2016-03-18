(function() {
    'use strict';

    var client;

    angular.module('chaise.dataEntry', [
        'ERMrest',
        'ngSanitize',
        'ui.select',
        'rzModule',
        '720kb.datepicker'
    ])

    // Configure the context info from the URI
    .config(['context', function configureContext(context) {
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

    .run(['context', 'ermrestServerFactory', 'table', '$http', function runApp(context, ermrestServerFactory, table, $http) {
        var server = ermrestServerFactory.getServer(context.serviceURL);
        server.catalogs.get(context.catalogID).then(function success(catalog) {
            var schema = catalog.schemas.get(context.schemaName);
            if (schema) {
                var data = schema.tables.get(context.tableName);
                if (data) {
                    console.log('Data: ', data);
                    table.name = data.name;
                    table.columns = data.columns.all();
                    table.keys = data.keys.colsets();

                    // Construct each foreignKey object and push to "table" value provider
                    var foreignRefs = data.foreignKeys.all();
                    var length = foreignRefs.length;
                    for (var i = 0; i < length; i++) {
                        var ref = foreignRefs[i];
                        var foreignKey = {};
                        foreignKey.colSet = ref.colset;

                        // Construct a display name for each foreign key's colset
                        var keysLength = foreignKey.colSet.columns.length;
                        for (var c = 0; c < keysLength; c++) {
                            if (!foreignKey.displayName) {
                                foreignKey.displayName = foreignKey.colSet.columns[c].name;
                            } else {
                                foreignKey.displayName = foreignKey.displayName + ' ' + foreignKey.colSet.columns[c].name;
                            }
                        }
                        table.foreignKeys.push(foreignKey);

                        // Capture the i from the for loop in a closure so that
                        // getDomainValues() has the correct i on success
                        (function(i) {
                            ref.getDomainValues().then(function success(values) {
                                table.foreignKeys[i].domainValues = values;
                                if (i == length - 1) {
                                    console.log('Table: ', table);
                                }
                            }, function error(response) {
                                console.log(response);
                            });
                        })(i);

                    }
                } else {
                    console.log('Table not found.');
                }
            } else {
                console.log('Schema not found.');
            }
        }, function error(response) {
            if (response.status == 401) {
                if (chaiseConfig.authnProvider == 'goauth') {
                    getGoauth(encodeSafeURIComponent(window.location.href));
                }
                console.log(response);
                throw response;
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
