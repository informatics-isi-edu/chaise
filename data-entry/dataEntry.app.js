(function() {
    'use strict';

    var client;

    angular.module('chaise.dataEntry', ['ERMrest', 'ngSanitize', 'ui.select'])

    // Configure the context info from the URI
    .config(['context', function configureContext(context) {
        context.serviceURL = window.location.origin + '/ermrest';

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

    .run(['context', 'ermrestClientFactory', 'data', function configureRun(context, ermrestClientFactory, data) {
        var client = ermrestClientFactory.getClient(context.serviceURL);
        client.getCatalog(context.catalogID).introspect().then(function success(schemas) {
            var schema = schemas[context.schemaName];
            if (schema) {
                var _table = schema.getTable(context.tableName);
                if (_table) {
                    data.table = _table;
                }
                console.log(data);
            }
        });
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
