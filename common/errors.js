(function() {
    'use strict';

    angular.module('chaise.errors', ['chaise.alerts', 'chaise.authen', 'chaise.modal', 'chaise.utils'])

    // Factory for each error type
    .factory('ErrorService', ['$log', '$window', '$uibModal', 'UriUtils', 'AlertsService', 'Session', function ErrorService($log, $window, $uibModal, UriUtils, AlertsService, Session) {

        function errorPopup(message, errorCode, pageName, redirectLink) {

            var params = {
                message: message,
                errorCode: errorCode,
                pageName: pageName
            }

            var modalInstance = $uibModal.open({
                templateUrl: '../common/templates/errorDialog.html',
                controller: 'ErrorDialogController',
                controllerAs: 'ctrl',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    params: params
                }
            });

            modalInstance.result.then(function () {
                $window.location.replace(redirectLink);
            });
        }

        // TODO: implement hierarchies of exceptions in ermrestJS and use that hierarchy to conditionally check for certain exceptions
        function catchAll(exception) {
            $log.info(exception);

            if (exception instanceof ERMrest.UnauthorizedError) {
                Session.login($window.location.href);
            }
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
            catchAll: catchAll,
            catalogNotFound: catalogNotFound,
            tableNotFound: tableNotFound,
            schemaNotFound: schemaNotFound
        };
    }]);
})();
