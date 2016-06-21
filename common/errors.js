(function() {
    'use strict';

    angular.module('chaise.errors', ['chaise.utils', 'chaise.alerts'])

    // Factory for each error type
    .factory('ErrorService', ['$log', '$uibModal', 'UriUtils', 'AlertsService', function ErrorService($log, $uibModal, UriUtils, AlertsService) {

        function errorPopup(message, errorCode) {
            var params = {
                message: message,
                errorCode: errorCode
            }

            var modalInstance = $uibModal.open({
                templateUrl: '../common/templates/errorDialog.html',
                controller: 'ErrorDialogController',
                controllerAs: 'ctrl',
                resolve: {
                    params: function() {
                        return params;
                    }
                }
            });

            modalInstance.result.then(function () {
                window.location = chaiseConfig.dataBrowser ? chaiseConfig.dataBrowser : window.location.origin;
            });
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
            errorPopup: errorPopup,
            catalogNotFound: catalogNotFound,
            tableNotFound: tableNotFound,
            schemaNotFound: schemaNotFound
        };
    }]);
})();
