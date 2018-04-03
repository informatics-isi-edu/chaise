(function() {
    'use strict';

    angular.module('chaise.errors', ['chaise.alerts', 'chaise.authen', 'chaise.modal', 'chaise.utils'])

    .constant('errorNames', {
        unauthorized: "Unauthorized",
        forbidden: "Forbidden",
        conflict: "Conflict",
        notFound: "Record Not Found",
        multipleRecords: "Multiple Records Found",
        noDataMessage: "No entity exists",
        multipleDataErrorCode : "Multiple Records Found",
        facetFilterMissing : "No filter or facet was defined.",
        multipleDataMessage : "There are more than 1 record found for the filters provided."
    })
    .constant('errorMessages', {
        unauthorized: "Unauthorized",
        forbidden: "Forbidden",
        notFound: "No data",
        multipleRecords: "Multiple Records Found",
        noDataMessage: 'The record does not exist or may be hidden. If you continue to face this issue, please contact the system administrator.',
        multipleDataErrorCode : "Multiple Records Found",
        multipleDataMessage : "There are more than 1 record found for the filters provided.",
        facetFilterMissing : "No filtering criteria was specified to identify a specific record.",
        systemAdminMessage : "An unexpected error has occurred. Please report this problem to your system administrators."
    })

    .factory('Errors', ['errorNames', 'errorMessages', function(errorNames, errorMessages) {

        // errorData object holds additional information viz. stacktrace, redirectUrl
        // Make sure to check cross-browser cmpatibility for stack attribute of Error Object

        /**
         * multipleRecordError - throw in case of multiple records.
         *
         * @param  {string} redirectUrl  redirect to recordset app
         * @param  {string} message      Error message
         * @return {object}              Error Object
         */
        function multipleRecordError(tableDisplayName, redirectUrl, message) {

            /**
             * @type {object}
             * @desc  custom object to store miscelleneous elements viz. stacktrace, redirectUrl
             */
            this.errorData = {}

            /**
            * @type {string}
            * @desc   Error message status; acts as Title text for error dialog
             */
            this.status = errorNames.multipleRecords;

            /**
            * @type {string}
            * @desc   Error message
             */
            this.message = (message === undefined ? errorMessages.multipleDataMessage : message);    //errorMessages is constant of all error message
            this.errorData.stack = (new Error()).stack;

            /**
             * @type {string}
             * @desc URL that redirects users to recordset app
             */
            this.errorData.redirectUrl = redirectUrl;
            this.errorData.gotoTableDisplayname = tableDisplayName;
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
        function noRecordError(filters, tableDisplayName, redirectUrl, message) {
          /**
           * @type {object}
           * @desc  custom object to store miscellaneous elements viz. stacktrace
           */
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
            /**
            * @type {string}
            * @desc   Error message status; acts as Title text for error dialog
             */
            this.status = errorNames.notFound;

            /**
            * @type {string}
            * @desc   Error message
             */
            this.message = noDataMessageDesc;

            this.errorData.stack = (new Error()).stack;
            /**
             * @type {string}
             * @desc URL that redirects users to recordset app
             */
            this.errorData.redirectUrl = redirectUrl;
            this.errorData.gotoTableDisplayname = tableDisplayName;
        }
        noRecordError.prototype = Object.create(Error.prototype);
        noRecordError.prototype.constructor = noRecordError;

        //TODO
        // InvalidInputError and MalformedUriError should be going away as they are redundant
        // They have definition in ERMrestjs and should be reused. utils.js doe not inject ermrestJS
        // module which causes dependency injection issue
        function MalformedUriError(message) {
            this.message = message;
        }

        MalformedUriError.prototype = Object.create(Error.prototype);
        MalformedUriError.prototype.constructor = MalformedUriError;

        function InvalidInputError(message) {
            this.message = message;
        }

        InvalidInputError.prototype = Object.create(Error.prototype);
        InvalidInputError.prototype.constructor = InvalidInputError;

        return {
            multipleRecordError: multipleRecordError,
            noRecordError:noRecordError,
            InvalidInputError: InvalidInputError,
            MalformedUriError: MalformedUriError
        };
    }])

    // Factory for each error type
    .factory('ErrorService', ['AlertsService', 'errorNames', 'Session', '$log', '$rootScope', '$window', 'errorMessages', 'Errors', 'DataUtils', 'UriUtils', 'modalUtils',
          function ErrorService(AlertsService, errorNames, Session, $log, $rootScope, $window, errorMessages, Errors, DataUtils, UriUtils, modalUtils) {

        var reloadCb = function(){
            window.location.reload();
        };

        function errorPopup(message, errorStatus, pageName, redirectLink, subMessage, stackTrace, errorCode, isDismissible) {
            var providedLink = true,
                isLoggedIn = false;
            var appName = UriUtils.appNamefromUrlPathname($window.location.pathname),
                session = Session.getSessionValue();
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
            //check if user is logged in
            if(session && session.client !== null){
              isLoggedIn = true;
            }

            var params = {
                message: message,
                errorStatus: errorStatus,
                pageName: pageName,
                subMessage: subMessage,
                appName: appName,
                isLoggedIn: isLoggedIn
            };

            var modalProperties = {
                windowClass: "modal-error",
                templateUrl: '../common/templates/errorDialog.modal.html',
                controller: 'ErrorModalController',
                controllerAs: 'ctrl',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    params: params
                },
                openedClass: 'error-open'
            };


            if (isDismissible || (chaiseConfig && chaiseConfig.allowErrorDismissal)) {  //If Forbidden error then allow modal to be dismissed
                delete modalProperties.keyboard;
                delete modalProperties.backdrop;
                params.canClose = true;
            }

            modalUtils.showModal(modalProperties, function (actionBtnIdentifier) {
                if ((errorStatus == errorNames.unauthorized && !providedLink) || (actionBtnIdentifier === "login")) {
                    Session.loginInAPopUp();
                } else {
                    if(actionBtnIdentifier == "reload"){
                        reloadCb();
                    } else{             //default action i.e. redirect link for OK button
                        $window.location = redirectLink;
                    }

                }
            });

            var reloadCb = function(){
                window.location.reload();
            };
        }

        var exceptionFlag = false;

        // TODO: implement hierarchies of exceptions in ermrestJS and use that hierarchy to conditionally check for certain exceptions
        function handleException(exception, isDismissible) {
            $log.info(exception);
            var reloadLink,
                redirectLink = $window.location.origin,
                gotoLocation = "Home Page",
                appName = UriUtils.appNamefromUrlPathname($window.location.pathname),
                errorCode = exception.code;

            var stackTrace =  (exception.errorData && exception.errorData.stack)? exception.errorData.stack: undefined;

            $rootScope.error = true;    // used to hide spinner in conjunction with a css property

            if (exceptionFlag || window.location.pathname.indexOf('/search/') != -1 || window.location.pathname.indexOf('/viewer/') != -1){
                return;
            }
            // we decided to deal with the OR condition later
            if ( (ERMrest && exception instanceof ERMrest.UnauthorizedError) || exception.code == errorNames.unauthorized) {
                Session.loginInAModal(reloadCb);
            } else if ((exception.status && exception.status == errorNames.multipleRecords) || exception.constructor.name === "noRecordError"){
                errorPopup(exception.message, exception.status, "Recordset ", exception.errorData.redirectUrl, stackTrace);
            } else if ( (ERMrest && exception instanceof ERMrest.ForbiddenError) || exception.code == errorNames.forbidden) {
                // we decided to deal with the OR condition later
                errorPopup( exception.message, exception.status ,"Home Page", $window.location.origin);
            } else if (ERMrest && exception instanceof ERMrest.ERMrestError ) {
                if (DataUtils.isObjectAndKeyDefined(exception.errorData, 'gotoTableDisplayname')){
                    gotoLocation = exception.errorData.gotoTableDisplayname;
                }
                if (DataUtils.isObjectAndKeyDefined(exception.errorData, 'redirectUrl')) {
                    redirectLink = exception.errorData.redirectUrl;
                } else {
                    redirectLink = $window.location.origin;
                }
                errorPopup( exception.message, exception.status, gotoLocation, redirectLink, exception.subMessage, '', errorCode, isDismissible);
            } else {
                logError(exception);

                var errName = exception.status? exception.status:"Terminal Error",
                    errorText = exception.message,
                    systemAdminMessage = errorMessages.systemAdminMessage,
                    redirectLink = $window.location.origin,
                    pageName = "Home Page";

                errName = (errName.toLowerCase() !== 'error') ? errName : "Terminal Error";

                errorPopup(
                    systemAdminMessage,
                    errName,
                    pageName,
                    redirectLink,
                    errorText,
                    stackTrace,
                    errorCode,
                    isDismissible
                );
            }
            if(!isDismissible) {  // if not a dismissible errror then exception should be suppressed 
            exceptionFlag = true;
          }
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


/**
 * Log the error in ermrest
 * @param  {object} error the error object
 */
var logError = function (error) {
    if (!ERMrest) return;

    var ermrestUri = chaiseConfig.ermrestLocation ? chaiseConfig.ermrestLocation : window.location.origin + '/ermrest';
    ERMrest.logError(error, ermrestUri).then(function () {
        console.log("logged the error");
    }).catch(function (err) {
        console.log("couldn't log the error.");
    });
};

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

    logError(error);

};
