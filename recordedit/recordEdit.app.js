(function() {
    'use strict';

/* Configuration of the Recordedit App */
    angular.module('chaise.configure-recordedit', ['chaise.config'])

    .constant('appName', 'recordedit')

    .run(['$rootScope', function ($rootScope) {
        // When the configuration module's run block emits the `configuration-done` event, attach the app to the DOM
        $rootScope.$on("configuration-done", function () {

            angular.element(document).ready(function(){
                angular.bootstrap(document.getElementById("recordedit"), ["chaise.recordEdit"]);
            });
        });
    }]);

/* Recordedit App */
    angular.module('chaise.recordEdit', [
        '720kb.datepicker',
        'duScroll',
        'chaise.alerts',
        'chaise.authen',
        'chaise.delete',
        'chaise.errors',
        'chaise.faceting',
        'chaise.filters',
        'chaise.inputs',
        'chaise.modal',
        'chaise.navbar',
        'chaise.upload',
        'chaise.record.table',
        'chaise.markdown',
        'chaise.resizable',
        'chaise.utils',
        'chaise.validators',
        'chaise.html',
        'ermrestjs',
        'ngCookies',
        'ngMessages',
        'ngSanitize',
        'ui.bootstrap',
        'ui.mask',
        'ui.select',
        'angular-markdown-editor',
        'chaise.footer',
        'chaise.recordcreate'
    ])

    .config(['$compileProvider', '$cookiesProvider', '$logProvider', '$provide', '$uibTooltipProvider', 'ConfigUtilsProvider', function($compileProvider, $cookiesProvider, $logProvider, $provide, $uibTooltipProvider, ConfigUtilsProvider) {
        ConfigUtilsProvider.$get().configureAngular($compileProvider, $cookiesProvider, $logProvider, $uibTooltipProvider);

        $provide.decorator('$templateRequest', ['ConfigUtils', 'UriUtils', '$delegate', function (ConfigUtils, UriUtils, $delegate) {
            return ConfigUtils.decorateTemplateRequest($delegate, UriUtils.chaiseDeploymentPath());
        }]);
    }])

    // TODO: is this ever being called?
    // maybe there's an error occuring inside of it and it's trying to catch itself but can't because of the error
    .config(function($provide) {
        $provide.decorator("$exceptionHandler", ['$log', '$injector', function($log, $injector) {
            return function(exception, cause) {
                var ErrorService = $injector.get("ErrorService");
                var Session = $injector.get("Session");
                var logService = $injector.get("logService");
                // If Conflict Error and user was previously logged in
                // AND if session is invalid, ask user to login rather than throw an error
                if (ERMrest && exception instanceof ERMrest.ConflictError && Session.getSessionValue()) {
                    // validate session will never throw an error, so it's safe to not write a reject callback or catch clause
                    Session.validateSession().then(function (session) {
                        if (!session) {
                            Session.loginInAModal();
                        } else {
                            ErrorService.handleException(exception);
                        }
                    });
                    // so the function will stop executing
                    return;
                }
                ErrorService.handleException(exception);
            };
        }]);
    })

    .run(['AlertsService', 'ConfigUtils', 'dataFormats', 'DataUtils', 'ERMrest', 'Errors', 'ErrorService', 'FunctionUtils', 'headInjector', 'InputUtils', 'logService', 'MathUtils', 'messageMap', 'recordCreate', 'recordEditModel', 'Session', 'UiUtils', 'UriUtils', '$cookies', '$log', '$rootScope', '$window',
        function runRecordEditApp(AlertsService, ConfigUtils, dataFormats, DataUtils, ERMrest, Errors, ErrorService, FunctionUtils, headInjector, InputUtils, logService, MathUtils, messageMap, recordCreate, recordEditModel, Session, UiUtils, UriUtils, $cookies, $log, $rootScope, $window) {

        var session;

        var context = ConfigUtils.getContextJSON(),
            chaiseConfig = ConfigUtils.getConfigJSON();

        context.chaiseBaseURL = UriUtils.chaiseBaseURL();

        $rootScope.showColumnSpinner = [{}];

        $rootScope.displayReady = false;
        $rootScope.showSpinner = false;

        UriUtils.setOrigin();

        // This is to allow the dropdown button to open at the top/bottom depending on the space available
        UiUtils.setBootstrapDropdownButtonBehavior();
        UriUtils.setLocationChangeHandling();

        // If defined but false, throw an error
        if (!chaiseConfig.editRecord && chaiseConfig.editRecord !== undefined) {
            var message = 'Chaise is currently configured to disallow editing records. Check the editRecord setting in chaise-config.js.';
            var error = new Error(message);
            error.code = "Record Editing Disabled";

            throw error;
        }

        var res = UriUtils.chaiseURItoErmrestURI($window.location, true);
        var ermrestUri = res.ermrestUri,
            pcid = res.pcid,
            ppid = res.ppid,
            isQueryParameter = res.isQueryParameter;

        context.catalogID = res.catalogId;

        // will be used to determine the app mode (edit, create, or copy) and determine whether we should call updated in the caller.
        // we cannot use the res.queryParams since that will only return the universally acceptable query params.
        // and not all the query parameters that might be in the url
        context.queryParams = UriUtils.getQueryParams($window.location.href);
        context.MAX_ROWS_TO_ADD = 201;

        // modes = create, edit, copy
        // create is contextualized to entry/create
        // edit is contextualized to entry/edit
        // copy is contextualized to entry/create
        // NOTE: copy is technically creating an entity so it needs the proper visible column list as well as the data for the record associated with the given filter
        context.modes = {
            COPY: "copy",
            CREATE: "create",
            EDIT: "edit"
        }
        // mode defaults to create
        context.mode = context.modes.CREATE;

        FunctionUtils.registerErmrestCallbacks();

        // Subscribe to on change event for session
        var subId = Session.subscribeOnChange(function() {
            // Unsubscribe onchange event to avoid this function getting called again
            Session.unsubscribeOnChange(subId);

            // Get existing session value
            session = Session.getSessionValue();

            // If session is not defined or null (Anonymous user) prompt the user to login
            if (!session) {
                var notAuthorizedError = new ERMrest.UnauthorizedError(messageMap.unauthorizedErrorCode, (messageMap.unauthorizedMessage + messageMap.reportErrorToAdmin));
                throw notAuthorizedError;
            }

            // On resolution
            ERMrest.resolve(ermrestUri, ConfigUtils.getContextHeaderParams()).then(function getReference(reference) {


                // we are using filter to determine app mode, the logic for getting filter
                // should be in the parser and we should not duplicate it in here
                // NOTE: we might need to change this line (we're parsing the whole url just for fidinig if there's filter)
                var location = reference.location;

                // Mode can be any 3 with a filter
                if (location.filter || location.facets) {
                    // prefill always means create
                    // copy means copy regardless of a limit defined
                    // edit is everything else with a filter
                    context.mode = (context.queryParams.prefill ? context.modes.CREATE : (context.queryParams.copy ? context.modes.COPY : context.modes.EDIT));
                } else if (context.queryParams.limit) {
                    context.mode = context.modes.EDIT;
                }
                context.appContext = (context.mode == context.modes.EDIT ? "entry/edit" : "entry/create");

                //contextualize the reference based on the mode (determined above) recordedit is in
                if (context.mode == context.modes.EDIT) {
                    $rootScope.reference = reference.contextualize.entryEdit;
                } else if (context.mode == context.modes.CREATE || context.mode == context.modes.COPY) {
                    $rootScope.reference = reference.contextualize.entryCreate;
                }

                $rootScope.reference.session = session;
                $rootScope.session = session;

                $log.info("Reference: ", $rootScope.reference);

                // log attribues
                $rootScope.logStackPath = logService.logStackPaths.SET;
                $rootScope.logStack = [
                    logService.getStackNode(
                        logService.logStackTypes.SET,
                        $rootScope.reference.table,
                        $rootScope.reference.filterLogInfo
                    )
                ];

                var appMode;
                appMode = logService.appModes.EDIT;
                if (context.mode == context.modes.COPY) {
                    appMode = logService.appModes.CREATE_COPY;
                } else if (context.mode == context.modes.CREATE){
                    if (context.queryParams.invalidate && context.queryParams.prefill) {
                        appMode = logService.appModes.CREATE_PRESELECT;
                    } else {
                        appMode = logService.appModes.CREATE;
                    }
                }
                $rootScope.logAppMode = appMode;


                // The log object that will be used for the submission request
                var action = (context.mode == context.modes.CREATE || context.mode == context.modes.COPY) ? logService.logActions.CREATE : logService.logActions.UPDATE;
                var logObj = {
                    action: logService.getActionString(action),
                    stack: logService.getStackObject()
                };
                if (pcid) logObj.pcid = pcid;
                if (ppid) logObj.ppid = ppid;
                if (isQueryParameter) logObj.cqp = 1;
                context.logObject = logObj;

                $rootScope.reference.columns.forEach(function (column, index) {
                    recordEditModel.columnModels[index] = recordCreate.columnToColumnModel(column);
                });

                // Case for editing an entity
                if (context.mode == context.modes.EDIT || context.mode == context.modes.COPY) {
                    if ($rootScope.reference.canUpdate) {

                        var numberRowsToRead;
                        if (context.queryParams.limit) {
                            numberRowsToRead = Number(context.queryParams.limit);
                            if (context.queryParams.limit > context.MAX_ROWS_TO_ADD) {
                                var limitMessage = "Trying to edit " + context.queryParams.limit + " records. A maximum of " + context.MAX_ROWS_TO_ADD + " records can be edited at once. Showing the first " + context.MAX_ROWS_TO_ADD + " records.";
                                AlertsService.addAlert(limitMessage, 'error');
                            }
                        } else {
                            numberRowsToRead = context.MAX_ROWS_TO_ADD;
                        }

                        var logObj = {
                            action: logService.getActionString(logService.logActions.LOAD),
                            stack: logService.getStackObject()
                        };
                        $rootScope.reference.read(numberRowsToRead, logObj).then(function getPage(page) {
                            $log.info("Page: ", page);

                            if (page.tuples.length < 1) {
                                // TODO: understand the filter that was used and relate that information to the user (it oucld be a facet filter now)
                                var recordSetLink = page.reference.unfilteredReference.contextualize.compact.appLink;
                                throw new Errors.noRecordError({}, page.reference.displayname.value, recordSetLink);
                            }

                            var column, value;


                            // $rootScope.tuples is used for keeping track of changes in the tuple data before it is submitted for update
                            $rootScope.tuples = [];
                            if (context.mode == context.modes.EDIT && page.tuples.length == 1) {
                                $rootScope.displayname = page.tuples[0].displayname;
                            }
                            $rootScope.idSafeTableName = DataUtils.makeSafeIdAttr($rootScope.reference.table.name);
                            $rootScope.idSafeSchemaName = DataUtils.makeSafeIdAttr($rootScope.reference.table.schema.name);

                            for (var j = 0; j < page.tuples.length; j++) {
                                // We don't want to mutate the actual tuples associated with the page returned from `reference.read`
                                // The submission data is copied back to the tuples object before submitted in the PUT request
                                var shallowTuple = page.tuples[j].copy();
                                $rootScope.tuples.push(shallowTuple);

                                recordCreate.populateEditModelValues(recordEditModel, $rootScope.reference, page.tuples[j], j, context.mode == context.modes.COPY);
                            }

                            $rootScope.displayReady = true;
                            $log.info('Model: ', recordEditModel);
                            // Keep a copy of the initial rows data so that we can see if user has made any changes later
                            recordEditModel.oldRows = angular.copy(recordEditModel.rows);
                        }, function error(response) {
                            var errorData = {};
                            errorData.redirectUrl = $rootScope.reference.unfilteredReference.contextualize.compact.appLink;
                            errorData.gotoTableDisplayname = $rootScope.reference.displayname.value;
                            response.errorData = errorData;

                            if (DataUtils.isObjectAndKeyDefined(response.errorData, 'redirectPath')) {
                                var redirectLink = UriUtils.createRedirectLinkFromPath(response.errorData.redirectPath);
                                response.errorData.redirectUrl = response instanceof ERMrest.InvalidFilterOperatorError ? redirectLink.replace('recordedit', 'recordset') : redirectLink;
                            }
                            throw response;
                        });
                    } else if (session) {
                        var forbiddenError = new ERMrest.ForbiddenError(messageMap.unauthorizedErrorCode, (messageMap.unauthorizedMessage + messageMap.reportErrorToAdmin));
                        forbiddenError.subMessage = $rootScope.reference.canUpdateReason;
                        // user logged in but not allowed (forbidden)
                        throw forbiddenError;
                    } else {
                        var notAuthorizedError = new ERMrest.UnauthorizedError(messageMap.unauthorizedErrorCode, (messageMap.unauthorizedMessage + messageMap.reportErrorToAdmin));
                        // user not logged in (unauthorized)
                        throw notAuthorizedError;
                    }
                } else if (context.mode == context.modes.CREATE) {
                    if ($rootScope.reference.canCreate) {
                        $rootScope.idSafeTableName = DataUtils.makeSafeIdAttr($rootScope.reference.table.name);
                        $rootScope.idSafeSchemaName = DataUtils.makeSafeIdAttr($rootScope.reference.table.schema.name);

                        recordCreate.populateCreateModelValues(recordEditModel, $rootScope.reference, context.queryParams.prefill);

                        $rootScope.displayReady = true;
                        // if there is a session, user isn't allowed to create
                    } else if (session) {
                        var forbiddenError = new ERMrest.ForbiddenError(messageMap.unauthorizedErrorCode, (messageMap.unauthorizedMessage + messageMap.reportErrorToAdmin));
                        forbiddenError.subMessage = $rootScope.reference.canCreateReason;
                        throw forbiddenError;
                        // user isn't logged in and needs permissions to create
                    } else {
                        throw new ERMrest.UnauthorizedError(messageMap.unauthorizedErrorCode, (messageMap.unauthorizedMessage + messageMap.reportErrorToAdmin));
                    }
                }
            }, function error(response) {
                if (DataUtils.isObjectAndKeyDefined(response.errorData, 'redirectPath')) {
                    var redirectLink = UriUtils.createRedirectLinkFromPath(response.errorData.redirectPath);
                    response.errorData.redirectUrl = response instanceof ERMrest.InvalidFilterOperatorError ? redirectLink.replace('recordedit', 'recordset') : redirectLink;
                }
                throw response;
            });
        });
    }]);
})();
