(function() {
    'use strict';

    angular.module('chaise.errors', ['chaise.alerts', 'chaise.authen', 'chaise.modal', 'chaise.utils'])

    .constant('errorNames', {
        unauthorized: "Unauthorized",
        forbidden: "Forbidden",
        notFound: "Not Found"
    })

    .factory('Errors', [function() {
        function MalformedUriError(message) {
            this.message = message;
        }

        MalformedUriError.prototype = Object.create(Error.prototype);
        MalformedUriError.prototype.constructor = MalformedUriError;

        function InvalidInputError(message) {
            this.message = message;
        }

        InvalidInputError.prototype = Object.create(Error.prototype);
        InvalidInputError.prototype.constructor = MalformedUriError;

        return {
            InvalidInputError: InvalidInputError,
            MalformedUriError: MalformedUriError
        };
    }])

    // Factory for each error type
    .factory('ErrorService', ['AlertsService', 'errorNames', 'Session', 'messageMap', '$log', '$rootScope', '$uibModal', '$window', function ErrorService(AlertsService, errorNames, Session, messageMap, $log, $rootScope, $uibModal, $window) {

        function errorPopup(message, errorCode, pageName, redirectLink, subMessage, stackTrace) {
            var providedLink = true;
            // if it's not defined, redirect to the dataBrowser config setting (if set) or the landing page
            if (!redirectLink) {
                providedLink = false;
                var redirectLink = (chaiseConfig.dataBrowser ? chaiseConfig.dataBrowser : $window.location.origin);
            }


            var isFirefox = typeof InstallTrigger !== 'undefined';
            var isChrome = !!window.chrome && !!window.chrome.webstore;
            // If browser is chrome then
            if (subMessage && stackTrace) {
                if (isChrome) {
                    subMessage = stackTrace;
                } else {
                    subMessage = subMessage + "\n   " + stackTrace.split("\n").join("\n   ");
                }
            }
            var params = {
                message: message,
                errorCode: errorCode,
                pageName: pageName,
                subMessage: subMessage
            };

            var modalProperties = {
                templateUrl: '../common/templates/errorDialog.modal.html',
                controller: 'ErrorModalController',
                controllerAs: 'ctrl',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    params: params
                }
            };


            if (chaiseConfig && chaiseConfig.allowErrorDismissal) {
                delete modalProperties.keyboard;
                delete modalProperties.backdrop;
                params.canClose = true;
            }

            var modalInstance = $uibModal.open(modalProperties);

            modalInstance.result.then(function () {
                if (errorCode == errorNames.unauthorized && !providedLink) {
                    Session.login($window.location.href);
                } else {
                    $window.location.replace(redirectLink);
                }
            });
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

        function MalformedUriError(message) {
            this.message = message;
        }

        MalformedUriError.prototype = Object.create(Error.prototype);
        MalformedUriError.prototype.constructor = MalformedUriError;

        function InvalidInputError(message) {
            this.message = message;
        }

        InvalidInputError.prototype = Object.create(Error.prototype);
        InvalidInputError.prototype.constructor = MalformedUriError;

        var exceptionFlag = false;

        // TODO: implement hierarchies of exceptions in ermrestJS and use that hierarchy to conditionally check for certain exceptions
        function handleException(exception) {
            $log.info(exception);

            if (exceptionFlag || window.location.pathname.indexOf('/search/') != -1 || window.location.pathname.indexOf('/viewer/') != -1) return;

            if (ERMrest && exception instanceof ERMrest.UnauthorizedError || exception.code == errorNames.unauthorized) {
                Session.login($window.location.href);
            } else if (ERMrest && exception instanceof ERMrest.PreconditionFailedError) {
                // A more useful general message for 412 Precondition Failed
                AlertsService.addAlert({type: 'warning', message: messageMap.generalPreconditionFailed});
            } else {

                var errName = exception.constructor.name;
                errName = (errName.toLowerCase() !== 'error') ? errName : "Terminal Error";

                errorPopup("An unexpected error has occurred. Please report this problem to your system administrators.", errName, "Home Page", $window.location.origin,  exception.message , exception.stack);
            }

            exceptionFlag = true;
        }

        return {
            errorPopup: errorPopup,
            noRecordError: noRecordError,
            handleException: handleException
        };
    }])

    .config(function($provide) {
        $provide.decorator("$exceptionHandler", ['$log', '$injector' , function($log, $injector) {
            return function(exception, cause) {
                var ErrorService = $injector.get("ErrorService");
                ErrorService.handleException(exception);
            };
        }]);
    });

})();


window.onerror = function() {

    if (window.location.pathname.indexOf('/search/') != -1 || window.location.pathname.indexOf('/viewer/') != -1) {
        console.log(arguments[4]);
        return;
    }

    var canClose = false;

    if (chaiseConfig && chaiseConfig.allowErrorDismissal) {
        canClose = true;
    }

    var error = arguments[4];
    error.stack = [
        arguments[1],
        arguments[2],
        arguments[3]
    ].join(':');

    var redirectLink = (chaiseConfig.dataBrowser ? chaiseConfig.dataBrowser : window.location.origin);

    if (!document || !document.body) return;

    var errName = error.constructor.name;
    errName = (errName.toLowerCase() !== 'error') ? errName : "Terminal Error";

    var html  = '<div modal-render="true" tabindex="-1" role="dialog" class="modal fade in" index="0" animate="animate" modal-animation="true" style="z-index: 1050; display: block;">'
        + '<div class="modal-dialog" style="width:90% !important;">'
            + '<div class="modal-content" uib-modal-transclude="">'
                + '<div class="modal-header">'
                    + (canClose ? '<button class="btn btn-default pull-right modal-close" type="button" onclick="document.getElementById(\"divErrorModal\").remove();">X</button>' : '')
                    + '<h3 class="modal-title ">Error: ' + errName + '</h3>'
                + '</div>'
                + '<div class="modal-body ">'
                    + 'An unexpected error has occurred. Please report this problem to your system administrators.'
                    + '<br><br>'
                    + 'Click OK to return to the Home Page.'
                    + '<br>'
                    + '<span class="terminalError"><br>'
                        + '<pre  style="word-wrap: unset;">' + error.message + '<br><span style="padding-left:20px;">' + error.stack + '</span></pre>'
                    + '</span>'
                + '</div>'
                + '<div class="modal-footer">'
                    + '<button class="btn btn-danger" type="button" onclick="window.location.replace(\'' + redirectLink + '\');">OK</button>'
                + '</div>'
            + '</div>'
        + '</div>'
    + '</div>'
    + '<div class="modal-backdrop fade in" style="z-index: 1040;"></div>';

    if (canClose) {
        var el = document.createElement('div');
        el.id = "divErrorModal";
        el.innerHTML = html;
        document.body.appendChild(el);
    } else {
        document.body.innerHTML = html;
    }

};
