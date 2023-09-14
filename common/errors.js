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
        multipleDataMessage : "There are more than 1 record found for the filters provided.",
        limitedBrowserSupport: 'Limited Browser Support'
    })
    .constant('errorMessages', {
        unauthorized: "Unauthorized",
        forbidden: "Forbidden",
        notFound: "No data",
        multipleRecords: "Multiple Records Found",
        noDataMessage: 'The record does not exist or may be hidden. <br> If you continue to face this issue, please contact the system administrator.',
        multipleDataErrorCode: "Multiple Records Found",
        multipleDataMessage: "There are more than 1 record found for the filters provided.",
        facetFilterMissing: "No filtering criteria was specified to identify a specific record.",
        unauthorizedAssetRetrieval: "You must be logged in and authorized to download this asset.",
        forbiddenAssetRetrieval: " is logged in but not authorized to download this asset.",
        differentUserConflict1: "Continuing on this page requires that you be logged in as ",
        differentUserConflict2: ". However, you are currently logged in as ",
        anonUserConflict: "Your session has expired. Continuing on this page requires that you be logged in as ",
        systemAdminMessage: "An unexpected error has occurred. Try clearing your cache. <br> If you continue to face this issue, please contact the system administrator.",

        viewerOSDFailed: "Couldn't process the image. <br> If you continue to face this issue, please contact the system administrator.",
        viewerScreenshotFailed: "Couldn't process the screenshot."
    })

    .factory('Errors', ['ConfigUtils', 'errorNames', 'errorMessages', 'messageMap', function(ConfigUtils, errorNames, errorMessages, messageMap) {

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

        /**
         * NoRecordRidError - In case resolveable link has invalid RID
         *
         * @param  {string} message Error message
         * @return {object}         Error Object
         */
        function NoRecordRidError(message) {
            /**
             * @type {object}
             * @desc  custom object to store miscellaneous elements viz. stacktrace
             */
            this.errorData = {};

            /**
             * @type {string}
             * @desc   Error message status; acts as Title text for error dialog
             */
            this.status = errorNames.notFound;

            this.clickOkToDismiss = true;

            /**
             * @type {string}
             * @desc   Error message
             */
            this.message = message || errorMessages.noDataMessage;

            this.errorData.clickActionMessage = messageMap.clickActionMessage.dismissDialog;
        };
        NoRecordRidError.prototype = Object.create(Error.prototype);
        NoRecordRidError.prototype.constructor = NoRecordRidError;

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

        /**
         * Error class that is used when the user tries to acces an asset when they are not authorized
         *
         * @return {object}        Error Object
         */
        function UnauthorizedAssetAccess() {
            /**
             * @type {object}
             * @desc  custom object to store miscellaneous elements viz. stacktrace
             */
            this.errorData = {};

            /**
             * @type {string}
             * @desc   Error message status; acts as Title text for error dialog
             */
            this.status = messageMap.loginRequired;

            /**
             * @type {string}
             * @desc   Error message
             */
            this.message = errorMessages.unauthorizedAssetRetrieval;

            /**
             * @type {string}
             * @desc Action message to display for click of the OK button
             */
            this.errorData.clickActionMessage = messageMap.clickActionMessage.loginOrDismissDialog;

            /**
             * @type {boolean}
             * @desc Set true to dismiss the error modal on clicking the OK button
             */
            this.clickOkToDismiss = true;
        }

        UnauthorizedAssetAccess.prototype = Object.create(Error.prototype);
        UnauthorizedAssetAccess.prototype.constructor = UnauthorizedAssetAccess;

        /**
         * Error class that is used when the user tries to acces an asset when they are forbidden
         *
         * @return {object}        Error Object
         */
        function ForbiddenAssetAccess() {
            /**
             * @type {object}
             * @desc  custom object to store miscellaneous elements viz. stacktrace
             */
            this.errorData = {};

            /**
             * @type {string}
             * @desc   Error message status; acts as Title text for error dialog
             */
            this.status = messageMap.permissionDenied;

            /**
             * @type {string}
             * @desc   Error message
             */
            this.message = ConfigUtils.getContextJSON().user + errorMessages.forbiddenAssetRetrieval;

            /**
             * @type {string}
             * @desc Action message to display for click of the OK button
             */
            this.errorData.clickActionMessage = messageMap.clickActionMessage.dismissDialog;

            /**
             * @type {boolean}
             * @desc Set true to dismiss the error modal on clicking the OK button
             */
            this.clickOkToDismiss = true;
        }

        ForbiddenAssetAccess.prototype = Object.create(Error.prototype);
        ForbiddenAssetAccess.prototype.constructor = ForbiddenAssetAccess;

        /**
         * Error class that is used when a user logs , but the page's previous session was another user
         *
         * @return {object}        Error Object
         */
        function DifferentUserConflictError(sessionInfo, prevSessionInfo, cb) {
            /**
             * @type {object}
             * @desc  custom object to store miscellaneous elements viz. stacktrace
             */
            this.errorData = {};

            /**
             * @type {string}
             * @desc   Error message status; acts as Title text for error dialog
             */
            this.status = messageMap.loginStatusChanged;

            var prevUser;
            if (prevSessionInfo.client.full_name) {
                prevUser = '<span class="no-word-break">' + prevSessionInfo.client.full_name + ' (' + prevSessionInfo.client.display_name + ')</span>';
            } else {
                prevUser = prevSessionInfo.client.display_name;
            }

            if (sessionInfo) {
                var currUser;
                if (sessionInfo.client.full_name) {
                    currUser = '<span class="no-word-break">' + sessionInfo.client.full_name + ' (' + sessionInfo.client.display_name + ')</span>';
                } else {
                    currUser = sessionInfo.client.display_name;
                }

                /**
                 * @type {string}
                 * @desc   Error message
                 */
                this.message = errorMessages.differentUserConflict1 + prevUser + errorMessages.differentUserConflict2 + currUser + '.';

                /**
                 * @type {string}
                 * @desc message for the reload and continue buttons
                 */
                this.errorData.clickActionMessage = messageMap.clickActionMessage.continueMessageReload + currUser + '; or';

                /**
                 * @type {string}
                 * @desc text to display to the user
                 */
                this.errorData.continueMessage = messageMap.clickActionMessage.continueMessage1 + prevUser + messageMap.clickActionMessage.continueMessage2;

                /**
                 * @type {string}
                 * @desc button text for continue case
                 */
                this.errorData.continueBtnText = "Continue";
            } else {
                /**
                 * @type {string}
                 * @desc   Error message
                 */
                this.message = errorMessages.anonUserConflict + prevUser + '.';

                /**
                 * @type {string}
                 * @desc message for the reload and continue buttons
                 */
                this.errorData.clickActionMessage = messageMap.clickActionMessage.anonContinueMessageReload;

                /**
                 * @type {string}
                 * @desc text to display to the user
                 */
                this.errorData.continueMessage = messageMap.clickActionMessage.anonContinueMessage + prevUser + '.';

                /**
                 * @type {string}
                 * @desc button text for continue case
                 */
                this.errorData.continueBtnText = "Login";
            }

            /**
             * @type {boolean}
             * @desc Set true to dismiss the error modal on clicking the OK button
             */
            this.clickOkToDismiss = false;

            /**
             * @type {boolean}
             * @desc Set true to show the reload button in the modal
             */
            this.showReloadBtn = true;

            /**
             * @type {boolean}
             * @desc Set true to show the continue button in the modal
             */
            this.showContinueBtn = true;

            /**
             * @type {function}
             * @desc function to run when continue btn is clicked
             */
             this.errorData.continueCB = cb;
        }

        DifferentUserConflictError.prototype = Object.create(Error.prototype);
        DifferentUserConflictError.prototype.constructor = DifferentUserConflictError;

        /**
         * CustomError - throw custom error from Apps outside Chaise.
         *
         * @param  {string} header              Header of the Error Modal         *
         * @param  {string} message             Error message to display in Modal body. Can include HTML tags.
         * @param  {string} redirectUrl         URL to redirect to on clicking ok.
         * @param  {string} clickActionMessage  Message to display for the OK button. Can include HTML tags.
         * @param  {string} clickOkToDismiss    Set true to dismiss the error modal on clicking the OK button
         * @return {object}                     Error Object
         */
        function CustomError(header, message, redirectUrl, clickActionMessage, clickOkToDismiss, subMessage){
            /**
             * @type {string}
             * @desc Text to display in the Error Modal Header
             */
            this.status = header;

            /**
             * @type {string}
             * @desc Error message that shows in the Error modal body
             */
            this.message = message;


            /**
             * @type {string}
             * @desc Error message details that will not be displayed in body
             */
            this.subMessage = subMessage;

            /**
             * @type {object}
             * @desc  custom object to store miscelleneous elements viz. redirectUrl, message for the ok button
             */
            this.errorData = {};

            /**
             * @type {string}
             * @desc URL to redirect to when users click the OK button
             */
            this.errorData.redirectUrl = redirectUrl;

            /**
             * @type {string}
             * @desc Action message to display for click of the OK button
             */
            this.errorData.clickActionMessage = clickActionMessage;

            /**
             * @type {boolean}
             * @desc Set true to dismiss the error modal on clicking the OK button
             */
            this.clickOkToDismiss = clickOkToDismiss;
        }
        CustomError.prototype = Object.create(Error.prototype);
        CustomError.prototype.constructor = CustomError;

        function LimitedBrowserSupport (message, redirectUrl, clickActionMessage, clickOkToDismiss, subMessage) {
            /**
             * @type {string}
             * @desc Text to display in the Error Modal Header
             */
            this.status = errorNames.limitedBrowserSupport;

            /**
             * @type {string}
             * @desc Error message that shows in the Error modal body
             */
            this.message = message;

            /**
             * @type {string}
             * @desc Error message details that will not be displayed in body
             */
            this.subMessage = subMessage;

            /**
             * @type {object}
             * @desc  custom object to store miscelleneous elements viz. redirectUrl, message for the ok button
             */
            this.errorData = {};

            /**
             * @type {string}
             * @desc URL to redirect to when users click the OK button
             */
            this.errorData.redirectUrl = redirectUrl;

            /**
             * @type {string}
             * @desc Action message to display for click of the OK button
             */
            this.errorData.clickActionMessage = clickActionMessage;

            /**
             * @type {boolean}
             * @desc Set true to dismiss the error modal on clicking the OK button
             */
            this.clickOkToDismiss = clickOkToDismiss;
        }
        LimitedBrowserSupport.prototype = Object.create(CustomError.prototype);
        LimitedBrowserSupport.prototype.constructor = LimitedBrowserSupport;

        return {
            multipleRecordError: multipleRecordError,
            noRecordError: noRecordError,
            NoRecordRidError: NoRecordRidError,
            InvalidInputError: InvalidInputError,
            MalformedUriError: MalformedUriError,
            UnauthorizedAssetAccess: UnauthorizedAssetAccess,
            ForbiddenAssetAccess: ForbiddenAssetAccess,
            DifferentUserConflictError: DifferentUserConflictError,
            CustomError: CustomError,
            LimitedBrowserSupport: LimitedBrowserSupport
        };
    }])

    // Factory for each error type
    .factory('ErrorService', ['AlertsService', 'ConfigUtils', 'DataUtils', 'errorMessages', 'errorNames', 'Errors', 'logService', 'messageMap', 'modalUtils', 'Session', 'UriUtils', '$document', '$log', '$rootScope', '$timeout', '$window',
        function ErrorService(AlertsService, ConfigUtils, DataUtils, errorMessages, errorNames, Errors, logService, messageMap, modalUtils, Session, UriUtils, $document, $log, $rootScope, $timeout, $window) {

        // NOTE: overriding `window.onerror` in the ErrorService scope
        $window.onerror = function () {
          return handleException(arguments[4]);
        };

        /**
         * exception        - the error that was thrown
         * pageName         - the name of the page we will redirect to
         * redirectLink     - link that is used for redirect
         * subMessage       - message displayed after the exception message
         * stackTrace       - stack trace provided with error output
         * isDismissible    - if the error modal can be close
         * showLogin        - if the login link should be shown
         * message          - (optional) primary message displayed in modal (if defined, overwrites exception.message)
         * errorStatus      - (optional) error "name" (if defined, overwrites exception.status)
         * okBtnCallback    - (optional) the function that will be called when users click on "OK" button
         * closeBtnCallback - (optional) the function that will be called when users click on "Close" button
         */
        function errorPopup(exception, pageName, redirectLink, subMessage, stackTrace, isDismissible, showLogin, message, errorStatus, okBtnCallback, closeBtnCallback) {
            var chaiseConfig = ConfigUtils.getConfigJSON();
            var appName = UriUtils.appNamefromUrlPathname($window.location.pathname),
                session = Session.getSessionValue(),
                providedLink = true;

            var reloadCb = function(){
                window.location.reload();
            };

            if (!redirectLink) {
                providedLink = false;
                redirectLink = $window.location.origin;
            }


            var isFirefox = typeof InstallTrigger !== 'undefined';
            var isChrome = !!window.chrome && !!window.chrome.webstore;
            // If browser is chrome then use stack trace which has "Error"  appended before the trace
            // Else append subMessage before the trace to complete the message as FF does not generate sufficient error text
            if (stackTrace) {
                subMessage = (subMessage && !isChrome) ? (subMessage + "\n   " + stackTrace.split("\n").join("\n   ")) : stackTrace;
            }

            var params = {
                appName: appName,
                pageName: pageName,
                exception: exception,
                errorStatus: exception.status ? exception.status : "Terminal Error",
                message: message,
                subMessage: subMessage,
                canClose: false,
                showLogin: showLogin
            };

            var modalProperties = {
                windowClass: "modal-error",
                templateUrl:  UriUtils.chaiseDeploymentPath() + 'common/templates/errorDialog.modal.html',
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
                if (okBtnCallback) {
                    okBtnCallback();
                } else if ((errorStatus == errorNames.unauthorized && !providedLink) || (actionBtnIdentifier === "login")) {
                    // TODO this code path is not used at all
                    Session.loginInAPopUp(logService.logActions.LOGIN_ERROR_MODAL);
                } else {
                    if(actionBtnIdentifier == "reload"){
                        reloadCb();
                    } else{             //default action i.e. redirect link for OK button
                        $window.location = redirectLink;
                    }
                }
            }, function () {
                if (closeBtnCallback) {
                    closeBtnCallback();
                }
            }, moveErrorModal);

            function moveErrorModal() {
                var errorBody = $document[0].querySelector(".modal-error .modal-body");

                // make sure error popup is below the navbar
                var mainnav = $document[0].getElementById('navheader');
                if (mainnav !== null) {
                    var errorModal = $document[0].getElementsByClassName('modal-error')[0];
                    if (errorModal !== null && errorModal !== undefined) {
                            errorModal.style.top = mainnav.offsetHeight + "px";
                    }
                }

                /**
                 * make sure the error popup is scrollable
                 *
                 * The previous block is changing the position of error modal, which will
                 * affect the following. Since the effect might not be applied right away,
                 * I had to add this timeout. This will ensure that the errorBodyY that we
                 * are fetching is correct.
                 */
                $timeout(function(){
                    try {
                        var footerHeight = document.querySelector(".modal-footer").offsetHeight;
                        var errorBodyY = errorBody.getBoundingClientRect().y;
                        errorBody.style.overflowY = "auto";
                        errorBody.style.maxHeight = "calc(100vh - 2.5vh - " + (errorBodyY + footerHeight) + "px)";
                    } catch (exp) {
                        // fail silently
                        // instead of adding multiple checks, just catching error
                    }
                }, 200);

            }
        }

        var exceptionFlag = false;

        // TODO: implement hierarchies of exceptions in ermrestJS and use that hierarchy to conditionally check for certain exceptions
        function handleException(exception, isDismissible, skipLogging, okBtnCallback, closeBtnCallback) {
            var chaiseConfig = ConfigUtils.getConfigJSON();
            $log.info(exception);

            // arguments for `errorPopup()` in order for method declaration
            var pageName = "Home Page",
                redirectLink = chaiseConfig.dataBrowser,
                subMessage = (exception.subMessage ? exception.subMessage : undefined),
                stackTrace = ( (exception.errorData && exception.errorData.stack) ? exception.errorData.stack : undefined),
                showLogin = false,
                message = exception.message || "", // initialize message to empty string if not defined
                errorStatus;

            $rootScope.error = true;    // used to hide spinner in conjunction with a css property

            // if network is offline, use offline dialog workflow
            if (!$window.navigator.onLine) return offlineModalTemplate(exception, "Please check that you are still connected to your network. ", null, true);

            // don't throw an angular error if has already been thrown
            if (exceptionFlag) return;

            // If not authorized, ask user to sign in first
            if (ERMrest && exception instanceof ERMrest.UnauthorizedError) {
                // Unauthorized (needs to login)
                Session.loginInAModal(function() {
                    if (Session.shouldReloadPageAfterLogin()) {
                        window.location.reload();
                    } else if (!Session.isSameSessionAsPrevious()) {
                        handleException(new Errors.DifferentUserConflictError(Session.getSessionValue(), Session.getPrevSessionValue()), false);
                    }
                });
                return;
            }

            var assetPermissionError = (exception instanceof Errors.UnauthorizedAssetAccess || exception instanceof Errors.ForbiddenAssetAccess || exception instanceof Errors.DifferentUserConflictError);

            if (exception instanceof Errors.multipleRecordError || exception instanceof Errors.noRecordError || exception instanceof Errors.NoRecordRidError){
                // change defaults
                pageName = "Recordset";
                redirectLink = exception.errorData.redirectUrl;
            }
            else if (ERMrest && exception instanceof ERMrest.InvalidServerResponse) {
                if (!skipLogging) {
                    logError(exception, ConfigUtils.getContextHeaderParams());
                }
                message = errorMessages.systemAdminMessage;
                subMessage = exception.message;
            }
            else if (ERMrest && exception instanceof ERMrest.ERMrestError ) {
                if (DataUtils.isObjectAndKeyDefined(exception.errorData, 'gotoTableDisplayname')) pageName = exception.errorData.gotoTableDisplayname;
                if (DataUtils.isObjectAndKeyDefined(exception.errorData, 'redirectUrl')) redirectLink = exception.errorData.redirectUrl;

                // the raw conflict error message is not readable by users,
                // so we're going to show a terminal error instead
                // NOTE we might want to do the same thing for all the other ermrest HTTP errors
                if (
                    exception instanceof ERMrest.ConflictError &&
                    !(
                        exception instanceof ERMrest.IntegrityConflictError ||
                        exception instanceof ERMrest.DuplicateConflictError
                    )
                ) {
                    message = errorMessages.systemAdminMessage;
                }
            }
            else if (exception instanceof Errors.CustomError ) {
                if (!skipLogging) {
                    logError(exception, ConfigUtils.getContextHeaderParams());
                }
                redirectLink = exception.errorData.redirectUrl;
            }
            else if (!assetPermissionError) {
                if (!skipLogging) {
                    logError(exception, ConfigUtils.getContextHeaderParams());
                }
                message = errorMessages.systemAdminMessage;
                subMessage = exception.message;
            }

            // There's no message
            if (message.trim().length < 1) message = errorMessages.systemAdminMessage;

            if (!Session.getSessionValue() && !assetPermissionError && !(exception instanceof Errors.LimitedBrowserSupport)) {
                showLogin = true;
                if (exception instanceof Errors.noRecordError || exception instanceof Errors.NoRecordRidError) {
                    // if no logged in user, change the message
                    var messageReplacement = (exception instanceof Errors.noRecordError ? messageMap.noRecordForFilter : messageMap.noRecordForRid);
                    message = messageReplacement + '<br>' + messageMap.maybeUnauthorizedMessage;
                } else {
                    message += " " + messageMap.maybeNeedLogin;
                }
            }

            errorPopup(exception, pageName, redirectLink, subMessage, stackTrace, isDismissible, showLogin, message, errorStatus, okBtnCallback, closeBtnCallback);

            // if not a dismissible error then exception should be suppressed
            if (!isDismissible && !exception.showContinueBtn && !exception.clickOkToDismiss) exceptionFlag = true;
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

/** Functions to execute outside of the scope of angular **/

/**
 * Log the error in ermrest
 * @param  {object} error the error object
 */
var logError = function (error, contextHeaderParams) {
    if (!ERMrest) return;
    var ermrestUri = (typeof chaiseConfig != 'undefined' && chaiseConfig.ermrestLocation ? chaiseConfig.ermrestLocation : window.location.origin + '/ermrest');

    if (!contextHeaderParams || typeof contextHeaderParams !== "object" &&
        typeof window.dcctx === "object" && typeof window.dcctx.contextHeaderParams === "object") {
        contextHeaderParams = window.dcctx.contextHeaderParams;
    }

    ERMrest.logError(error, ermrestUri, contextHeaderParams).then(function () {
        console.log("logged the error");
    }).catch(function (err) {
        console.log("couldn't log the error.");
    });
};

var errorVisible = false;
// generic template for error dialogs when the server or nerwork is not available
var offlineModalTemplate = function (error, dialogMessage, redirectLink, canClose) {
    var errorVisible = document.getElementById('divErrorModal');
    if (!document || !document.body || errorVisible) return;

    var errName = error.constructor.name;
    errName = (errName.toLowerCase() !== 'error') ? errName : "Terminal Error";

    var html  = '<div modal-render="true" tabindex="-1" role="dialog" class="modal fade in" index="0" animate="animate" modal-animation="true" style="z-index: 1050; display: block;">'
        + '<div class="modal-dialog" style="width:90% !important;">'
            + '<div class="modal-content" uib-modal-transclude="">'
                + '<div class="modal-header">'
                    + (canClose ? '<button class="btn btn-default pull-right modal-close" type="button" onclick="document.getElementById(\'divErrorModal\').remove();">X</button>' : '')
                    + '<h2 class="modal-title ">Error: ' + errName + '</h2>'
                + '</div>'
                + '<div class="modal-body ">'
                    + 'An unexpected error has occurred. ' + dialogMessage + '<br>If you continue to face this issue, please contact the system administrator.'
                    + '<br><br>'
                    + 'Click OK to return to the Home Page.'
                    + '<br>'
                    + '<span class="terminalError"><br>'
                        + '<pre  style="word-wrap: unset;">' + error.message + '<br><span style="padding-left:20px;">' + error.stack + '</span></pre>'
                    + '</span>'
                + '</div>'
                + '<div class="modal-footer">'
                    + '<button class="btn btn-danger" type="button" onclick=' + (redirectLink ? '"window.location.replace(\'' + redirectLink + '\');"' : '"document.getElementById(\'divErrorModal\').remove();"') + '>OK</button>'
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

    errorVisible = true;
    logError(error);
}

window.onerror = function() {

    var canClose = false;

    if (typeof chaiseConfig != 'undefined' && chaiseConfig.allowErrorDismissal) {
        canClose = true;
    }

    var error = arguments[4];
    error.stack = [
        arguments[1],
        arguments[2],
        arguments[3]
    ].join(':');

    var redirectLink = (typeof chaiseConfig != 'undefined' && chaiseConfig.dataBrowser ? chaiseConfig.dataBrowser : window.location.origin);
    var message = "Try clearing your cache. ";
    offlineModalTemplate(error, message, redirectLink, canClose);
};
