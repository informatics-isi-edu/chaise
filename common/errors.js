(function() {
    'use strict';

    angular.module('chaise.errors', ['chaise.utils', 'chaise.alerts'])

    // Factory for each error type
    .factory('ErrorService', ['$log', 'UriUtils', 'AlertsService', function ErrorService($log, UriUtils, AlertsService) {
        // This may change, but figured each app would handle this similarly
        function catalogNotFound(catalogID, error) {
            AlertsService.addAlert({type: 'error', message: 'Sorry, the requested catalog "' + catalogID + '" was not found. Please check the URL and refresh the page' });
            $log.info(error);
        }

        // This may change, but figured each app would handle this similarly
        function tableNotFound(tableName, error) {
            AlertsService.addAlert({type: 'error', message: 'Sorry, the requested table "' + tableName + '" was not found. Please check the URL and refresh the page.' });
            $log.info(error);
        }

        // This may change, but figured each app would handle this similarly
        function schemaNotFound(schemaName, error) {
            AlertsService.addAlert({type: 'error', message: 'Sorry, the requested schema "' + schemaName + '" was not found. Please check the URL and refresh the page' });
            $log.info(error);
        }

        return {
            catalogNotFound: catalogNotFound,
            tableNotFound: tableNotFound,
            schemaNotFound: schemaNotFound
        };
    }]);
})();
