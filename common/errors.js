(function() {
    'use strict';

    angular.module('chaise.errors', ['chaise.alerts', 'chaise.authen', 'chaise.modal', 'chaise.utils'])

    // Factory for each error type
    .factory('ErrorService', ['Session', '$log', '$uibModal', '$window', 'AlertsService', function ErrorService(Session, $log, $uibModal, $window, AlertsService) {

        function errorPopup(message, errorCode, pageName, redirectLink) {
            // if it's not defined, redirect to the dataBrowser config setting (if set) or the landing page
            if (!redirectLink) var redirectLink = (chaiseConfig.dataBrowser ? chaiseConfig.dataBrowser : $window.location.origin);

            var params = {
                message: message,
                errorCode: errorCode,
                pageName: pageName
            };

            var modalInstance = $uibModal.open({
                templateUrl: '../common/templates/errorDialog.modal.html',
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
            } else {
                AlertsService.addAlert({type:'error', message:exception.message});
            }
        }

        return {
            errorPopup: errorPopup,
            catchAll: catchAll
        };
    }]);
})();
