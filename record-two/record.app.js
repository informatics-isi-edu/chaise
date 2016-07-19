(function() {
    'use strict';

    angular.module('chaise.record', [
        'chaise.errors',
        'chaise.modal',
        'chaise.navbar',
        'chaise.recordDisplay',
        'chaise.utils',
        'ERMrest',
        'ui.bootstrap'
    ])

    // Config is no
    .run(['ermrestServerFactory', 'UriUtils', 'ErrorService', '$log', '$rootScope', function runApp(ermrestServerFactory, UriUtils, ErrorService, $log, $rootScope) {
        try {
            UriUtils.setOrigin();
            // The context object won't change unless the app is reloaded
            var context = $rootScope.context = UriUtils.parseURLFragment(window.location);

            var server = context.server = ermrestServerFactory.getServer(context.serviceURL);
            server.catalogs.get(context.catalogID).then(function success(catalog) {
                var schema = catalog.schemas.get(context.schemaName);
                var table = $rootScope.table = schema.tables.get(context.tableName);

                if (context.filter.type === "BinaryPredicate" && context.filter.operator === "=") {
                    var recordPath = new ERMrest.DataPath(table);
                    var recordFilter = UriUtils.parsedFilterToERMrestFilter(context.filter, table);

                    recordPath.filter(recordFilter).entity.get().then(function success(record) {
                        // So the data can be passed through the directive and watched for changes
                        $rootScope.record = record[0];
                    }, function error(response) {
                        throw response;
                    });
                }
            }, function error(response) {
                throw response;
            }).catch(function genericCatch(exception) { // can't throw an exception to outer try catch for some reason
                ErrorService.catchAll(exception);
            });
        } catch (exception) { // Catches server get
            ErrorService.catchAll(exception);
        }
    }]);
})();
