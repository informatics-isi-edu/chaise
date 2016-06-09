(function() {
    'use strict';

    angular.module('chaise.errors', ['chaise.utils', 'chaise.alerts'])

    // Factory for each error type
    .factory('ErrorService', ['$log', 'UriUtils', 'AlertsService', function ErrorService($log, UriUtils, AlertsService) {

        function error401(error) {
            UriUtils.getGoauth(UriUtils.fixedEncodeURIComponent(window.location.href));
        }

        function error404(error) {
            // do nothing for now
        }

        function error409(error) {
            // retry logic
            // passthrough to app for now
        }

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
            error401: error401,
            error404: error404,
            error409: error409,
            annotationNotFound: annotationNotFound,
            catalogNotFound: catalogNotFound,
            tableNotFound: tableNotFound,
            schemaNotFound: schemaNotFound
        };
    }]);
})();
