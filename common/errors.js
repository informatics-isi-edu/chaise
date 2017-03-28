(function() {
    'use strict';

    angular.module('chaise.errors', ['chaise.alerts', 'chaise.authen', 'chaise.modal', 'chaise.utils'])
    
    .constant('errorNames', {
        unauthorized: "Unauthorized",
        forbidden: "Forbidden",
        notFound: "Not Found"
    })

    // Factory for each error type
    .factory('ErrorService', ['AlertsService', 'errorNames', 'Session', 'messageMap', '$log', '$rootScope', '$uibModal', '$window', function ErrorService(AlertsService, errorNames, Session, messageMap, $log, $rootScope, $uibModal, $window) {

        function errorPopup(message, errorCode, pageName, redirectLink, subMessage) {
            var providedLink = true;
            // if it's not defined, redirect to the dataBrowser config setting (if set) or the landing page
            if (!redirectLink) {
                providedLink = false;
                var redirectLink = (chaiseConfig.dataBrowser ? chaiseConfig.dataBrowser : $window.location.origin);
            }

            var params = {
                message: message,
                errorCode: errorCode,
                pageName: pageName,
                subMessage: subMessage
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
            // TODO: Add .catch for catchAll
        }

        function noRecordError(filters) {
            var noDataMessage = messageMap.noDataMessage;
            for (var k = 0; k < filters.length; k++) {
                noDataMessage += filters[k].column + filters[k].operator + filters[k].value;
                if (k != filters.length-1) {
                    noDataMessage += " or ";
                }
            }
            var error = new Error(noDataMessage);
            error.code = errorNames.notFound;

            return error;
        }

        // TODO: implement hierarchies of exceptions in ermrestJS and use that hierarchy to conditionally check for certain exceptions
        function catchAll(exception) {
            $log.info(exception);
            if (exception instanceof ERMrest.UnauthorizedError || exception.code == errorNames.unauthorized) {
                Session.login($window.location.href);
            } else if (exception instanceof ERMrest.PreconditionFailedError) {
                // A more useful general message for 412 Precondition Failed
                AlertsService.addAlert({type: 'warning', message: messageMap.generalPreconditionFailed});
            } else {
                AlertsService.addAlert({type:'error', message:exception.message});
            }
        }

        var exceptionFlag = false;

        // TODO: implement hierarchies of exceptions in ermrestJS and use that hierarchy to conditionally check for certain exceptions
        function handleException(exception) {
            $log.info(exception);

            if (exceptionFlag) return;

            if (exception instanceof ERMrest.UnauthorizedError || exception.code == errorNames.unauthorized) {
                Session.login($window.location.href);
            } else if (exception instanceof ERMrest.PreconditionFailedError) {
                // A more useful general message for 412 Precondition Failed
                AlertsService.addAlert({type: 'warning', message: messageMap.generalPreconditionFailed});
            } else {
                errorPopup("Oops! something went wrong.", 0, "Home Page", $window.location.origin, "The page encountered an error. See the Javascript console for technical details.");
            }

            exceptionFlag = true;
        }

        return {
            errorPopup: errorPopup,
            catchAll: catchAll,
            noRecordError: noRecordError,
            handleException: handleException
        };
    }])

    
    .factory('$exceptionHandler', ['$log', '$injector' , function($log, $injector) {

        return function(exception, cause) {
            var ErrorService = $injector.get("ErrorService");
            ErrorService.handleException(exception);
        };
    }])

})();
