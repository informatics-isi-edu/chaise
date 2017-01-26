(function() {
    'use strict';

    angular.module('chaise.errors', ['chaise.alerts', 'chaise.authen', 'chaise.modal', 'chaise.utils'])

    .constant('errorNames', {
        unauthorized: "Unauthorized",
        forbidden: "Forbidden",
        notFound: "Not Found"
    })

    // Factory for each error type
    .factory('ErrorService', ['AlertsService', 'errorNames', 'Session', '$log', '$rootScope', '$uibModal', '$window', function ErrorService(AlertsService, errorNames, Session, $log, $rootScope, $uibModal, $window) {

        function errorPopup(message, errorCode, pageName, redirectLink) {
            var providedLink = true;
            // if it's not defined, redirect to the dataBrowser config setting (if set) or the landing page
            if (!redirectLink) {
                providedLink = false;
                var redirectLink = (chaiseConfig.dataBrowser ? chaiseConfig.dataBrowser : $window.location.origin);
            }

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
                if (errorCode == errorNames.unauthorized && !providedLink) {
                    Session.login($window.location.href);
                } else {
                    $window.location.replace(redirectLink);
                }
            });
        }

        // TODO: implement hierarchies of exceptions in ermrestJS and use that hierarchy to conditionally check for certain exceptions
        function catchAll(exception) {
            $log.info(exception);

            if (exception instanceof ERMrest.UnauthorizedError || exception.code == errorNames.unauthorized) {
                Session.login($window.location.href);
            } else if (exception instanceof ERMrest.PreconditionFailedError) {
                // A more useful message for 412 Precondition Failed
                AlertsService.addAlert({type: 'warning', message: 'This page is out of sync with the server. Please refresh the page and try again.'});
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
