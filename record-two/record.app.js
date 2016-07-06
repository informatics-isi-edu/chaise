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

    // configure the context
    .config(['context', 'UriUtilsProvider', function configureContext(context, UriUtilsProvider) {
        var utils = UriUtilsProvider.$get();

        if (chaiseConfig.headTitle !== undefined) {
            document.getElementsByTagName('head')[0].getElementsByTagName('title')[0].innerHTML = chaiseConfig.headTitle;
        }

        utils.setOrigin();
        utils.parseURLFragment(window.location, context);

        console.log("Context", context);
    }])

    .run(['context', 'ermrestServerFactory', 'recordModel', 'ErrorService', '$log', function runApp(context, ermrestServerFactory, recordModel, ErrorService, $log) {
        try {
            var server = context.server = ermrestServerFactory.getServer(context.serviceURL);
            server.catalogs.get(context.catalogID).then(function success(catalog) {
                var schema = catalog.schemas.get(context.schemaName);
                var table = recordModel.table = schema.tables.get(context.tableName);

                if (context.filters.length == 1) {
                    var filter = context.filters[0];
                    var recordPath = new ERMrest.DataPath(table);
                    var recordFilter = new ERMrest.BinaryPredicate(table.columns.get(filter.name), filter.op, filter.value);

                    recordPath.filter(recordFilter).entity.get().then(function success(record) {
                        recordModel.record = record[0];
                        console.log(record[0]);
                    }, function error(response) {

                    });
                }
            }, function error(response) {
                throw response;
            }).catch(function genericCatch(exception) { // can't throw an exception to outer try catch for some reason
                ErrorService.catchAll(exception);
            });
        } catch (exception) { // Catches server get
            $log.info(exception);
        }
    }]);
})();
