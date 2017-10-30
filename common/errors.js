(function() {
    'use strict';

    angular.module('chaise.errors', ['chaise.alerts', 'chaise.authen', 'chaise.modal', 'chaise.utils'])

    .constant('errorNames', {
        unauthorized: "Unauthorized",
        forbidden: "Forbidden",
        notFound: "Not Found",
        multipleRecords: "Multiple Records Found",
        noDataMessage: "No entity exists",
        multipleDataErrorCode : "Multiple Records Found",
        multipleDataMessage : "There are more than 1 record found for the filters provided."
    })
    .constant('errorMessages', {
        unauthorized: "Unauthorized",
        forbidden: "Forbidden",
        notFound: "Not Found",
        multipleRecords: "Multiple Records Found",
        noDataMessage: "No entity exists with ",
        multipleDataErrorCode : "Multiple Records Found",
        multipleDataMessage : "There are more than 1 record found for the filters provided.",
        systemAdminMessage : "An unexpected error has occurred. Please report this problem to your system administrators."
    })

    .factory('Errors', ['errorNames', 'errorMessages', function(errorNames, errorMessages) {

        // errorData object holds additional information viz. stacktrace, redirectUrl
        // Make sure to check cross-browser cmpatibility for stack attribute of Error Object
        
        /**
         * multipleRecordError - throw incase of multiple records
         *
         * @param  {string} redirectUrl redirect to recordset
         * @param  {string} message     Error message
         * @return {object}             Error Object
         */
        function multipleRecordError(redirectUrl, message) {
            this.errorData = {}
            this.status = errorNames.multipleRecords;
            this.message = (message === undefined ? errorMessages.multipleDataMessage : message);    //errorMessages is constant of all error message
            this.errorData.stack = (new Error()).stack;
            this.errorData.redirectUrl = redirectUrl;
        }
        multipleRecordError.prototype = Object.create(Error.prototype);
        multipleRecordError.prototype.constructor = multipleRecordError;


        /**
         * noRecordError - In case URI returns empty set
         *
         * @param  {array} filters  Filters used during retrival of data
         * @param  {string} message Error message
         * @return {object}         Error Object
         */
        function noRecordError(filters, message) {
            this.errorData = {};
            var noDataMessageDesc = (message === undefined) ? errorMessages.noDataMessage : message;
            if (filters) {
                for (var k = 0; k < filters.length; k++) {
                    noDataMessage += filters[k].column + filters[k].operator + filters[k].value;
                    if (k != filters.length-1) {
                        noDataMessage += " or ";
                    }
                }
            }
            this.status = errorNames.notFound;
            this.message = noDataMessageDesc;
            this.errorData.stack = (new Error()).stack;
        }
        noRecordError.prototype = Object.create(Error.prototype);
        noRecordError.prototype.constructor = noRecordError;

        return {
            multipleRecordError: multipleRecordError,
            noRecordError:noRecordError
        };
    }])

    // Factory for each error type
    .factory('ErrorService', ['AlertsService', 'errorNames', 'Session', '$log', '$rootScope', '$uibModal', '$window', 'errorMessages', function ErrorService(AlertsService, errorNames, Session, $log, $rootScope, $uibModal, $window, errorMessages) {

        function errorPopup(message, errorCode, pageName, redirectLink, subMessage, stackTrace) {
            var providedLink = true;
            // if it's not defined, redirect to the dataBrowser config setting (if set) or the landing page
            if (!redirectLink) {
                providedLink = false;
                var redirectLink = (chaiseConfig.dataBrowser ? chaiseConfig.dataBrowser : $window.location.origin);
            }


            var isFirefox = typeof InstallTrigger !== 'undefined';
            var isChrome = !!window.chrome && !!window.chrome.webstore;
            // If browser is chrome then use stack trace which has "Error"  appended before the trace
            // Else append subMessage before the tarce to complete the message as FF does not generate sufficient error text
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

            var reloadCb = function(){
                window.location.reload();
            };

            modalInstance.result.then(function () {
                if (errorCode == errorNames.unauthorized && !providedLink) {
                    var x = window.innerWidth/2 - 800/2;
                    var y = window.innerHeight/2 - 600/2;

                    var win = window.open("", '_blank','width=800,height=600,left=' + x + ',top=' + y);
                    Session.loginInAPopUp(win, reloadCb);
                } else {
                    $window.location.replace(redirectLink);
                }
            });
        }

        var exceptionFlag = false;

        // TODO: implement hierarchies of exceptions in ermrestJS and use that hierarchy to conditionally check for certain exceptions
        function handleException(exception) {
            $log.info(exception);

            var reloadCb = function() {
                window.location.reload();
            };
            if (exceptionFlag || window.location.pathname.indexOf('/search/') != -1 || window.location.pathname.indexOf('/viewer/') != -1) return;

            // we decided to deal with the OR condition later
            if ( (ERMrest && exception instanceof ERMrest.UnauthorizedError) || exception.code == errorNames.unauthorized) {
                Session.loginInAModal(reloadCb);
            }
            else if (exception.status && exception.status == errorNames.multipleRecords){
                errorPopup(errorNames.multipleDataMessage, errorNames.multipleDataErrorCode,"Recordset ", exception.errorData.redirectUrl);
            }
            // we decided to deal with the OR condition later
            else if ( (ERMrest && exception instanceof ERMrest.ForbiddenError) || exception.code == errorNames.forbidden) {
                errorPopup( exception.message, exception.status ,"Home Page", $window.location.origin);
            }
            else {
                var errName = exception.status,
                    errorText = exception.message,
                    systemAdminMessage = errorMessages.systemAdminMessage,
                    stackTrace =  (exception.errorData && exception.errorData.stack)? exception.errorData.stack: undefined;
                errName = (errName.toLowerCase() !== 'error') ? errName : "Terminal Error";
                errorPopup(
                    systemAdminMessage,
                    errName,
                    "Home Page",
                    $window.location.origin,
                    errorText,
                    stackTrace
                );
            }

            exceptionFlag = true;
        }

        return {
            errorPopup: errorPopup,
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
                    + '<h2 class="modal-title ">Error: ' + errName + '</h2>'
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
