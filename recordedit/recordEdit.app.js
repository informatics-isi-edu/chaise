(function() {
    'use strict';
/* Configuration of the Recordedit App */
    angular.module('chaise.configure-recordedit', [
        'chaise.modal',
        'chaise.utils',
        'ermrestjs',
        'ngCookies',
        'ui.bootstrap'
    ])

    .run(['ERMrest', function (ERMrest) {
        ERMrest.onload().then(function () {
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

    .config(['$compileProvider', '$cookiesProvider', '$logProvider', '$uibTooltipProvider', 'ConfigUtilsProvider', function($compileProvider, $cookiesProvider, $logProvider, $uibTooltipProvider, ConfigUtilsProvider) {
        // angular configurations
        // allows unsafe prefixes to be downloaded
        // full regex: "/^\s*(https?|ftp|mailto|tel|file|blob):/"
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|blob):/);
        $cookiesProvider.defaults.path = '/';
        //  Enable log system, if in debug mode
        $logProvider.debugEnabled(chaiseConfig && chaiseConfig.debug === true);
        // Configure all tooltips to be attached to the body by default. To attach a
        // tooltip on the element instead, set the `tooltip-append-to-body` attribute
        // to `false` on the element.
        $uibTooltipProvider.options({appendToBody: true});

        // chaise configurations
        ConfigUtilsProvider.$get().setConfigJSON();
    }])

    .config(function($provide) {
        $provide.decorator("$exceptionHandler", ['$log', '$injector', function($log, $injector) {
            return function(exception, cause) {
                var ErrorService = $injector.get("ErrorService");
                var Session = $injector.get("Session");
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

    .run(['AlertsService', 'dataFormats', 'DataUtils', 'ERMrest', 'ErrorService', 'FunctionUtils', 'headInjector', 'InputUtils', 'logActions', 'MathUtils', 'recordEditAppUtils', 'recordEditModel', 'Session', 'UiUtils', 'UriUtils', '$log', '$rootScope', '$window', '$cookies', 'messageMap', 'Errors',
        function runRecordEditApp(AlertsService, dataFormats, DataUtils, ERMrest, ErrorService, FunctionUtils, headInjector, InputUtils, logActions, MathUtils, recordEditAppUtils, recordEditModel, Session, UiUtils, UriUtils, $log, $rootScope, $window, $cookies, messageMap, Errors) {

        var session,
            context = {};

        var chaiseConfig = Object.assign({}, $rootScope.chaiseConfig);
        context.catalogID = $window.location.hash.split('/')[0].slice(1);
        context.chaiseBaseURL = $window.location.href.replace($window.location.hash, '');

        $rootScope.showColumnSpinner = [{}];

        $rootScope.displayReady = false;
        $rootScope.showSpinner = false;

        UriUtils.setOrigin();
        headInjector.setupHead();

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

        var ermrestUri = UriUtils.chaiseURItoErmrestURI($window.location);

        $rootScope.context = context;

        // will be used to determine the app mode (edit, create, or copy)
        // We are not passing the query parameters that are used for app mode,
        // so we cannot use the queryParams that parser is returning.
        context.queryParams = UriUtils.getQueryParams($window.location);

        context.appName = "recordedit";
        context.pageId = MathUtils.uuid();
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
            ERMrest.resolve(ermrestUri, { cid: context.appName, pid: context.pageId, wid: $window.name }).then(function getReference(reference) {


                // we are using filter to determine app mode, the logic for getting filter
                // should be in the parser and we should not duplicate it in here
                // NOTE: we might need to change this line (we're parsing the whole url just for fidinig if there's filter)
                var location = ERMrest.parse(ermrestUri);

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


                // create the extra information that we want to log in ermrest
                // NOTE currently we're only setting the action, we might need to add extra information here
                var logObj = {action: logActions.update};
                if (context.mode == context.modes.COPY) {
                    logObj = {action: logActions.copy};
                } else if (context.mode == context.modes.CREATE){
                    if (context.queryParams.invalidate) {
                        if (context.queryParams.prefill) {
                            logObj = {action: logActions.createPrefill};
                        } else {
                            logObj = {action: logActions.createModal};
                        }
                    } else {
                        logObj = {action: logActions.create};
                    }
                }
                context.logObject = logObj;

                // Case for creating an entity, with prefilled values
                if (context.queryParams.prefill) {
                    // get the cookie with the prefill value
                    var cookie = $cookies.getObject(context.queryParams.prefill);
                    var newRow = recordEditModel.rows.length - 1;

                    // make sure cookie is correct
                    var hasAllKeys = cookie && ["constraintName", "columnName", "origUrl", "rowname"].every(function (k) {
                        return cookie.hasOwnProperty(k);
                    });
                    if (hasAllKeys) {
                        $rootScope.cookieObj = cookie;

                        // Update view model
                        recordEditModel.rows[newRow][cookie.columnName] = cookie.rowname.value;

                        // the foreignkey data that we already have
                        recordEditModel.foreignKeyData[newRow][cookie.constraintName] = cookie.keys;

                        // show the spinner that means we're waiting for data.
                        $rootScope.showColumnSpinner[newRow][cookie.columnName] = true;

                        // get the actual foreignkey data
                        ERMrest.resolve(cookie.origUrl, {cid: context.appName}).then(function (ref) {
                            // the table that we're logging is not the same table in url (it's the referrer that is the same)
                            var logObject = $rootScope.reference.defaultLogInfo;
                            logObject.referrer = ref.defaultLogInfo;
                            logObject.action = logActions.preCreatePrefill;
                            getForeignKeyData(newRow, cookie.columnName, cookie.constraintName, ref, logObject);
                        }).catch(function (err) {
                            $rootScope.showColumnSpinner[newRow][cookie.columnName] = false;
                            $log.warn(err);
                        });

                        // Update submission model
                        var columnNames = Object.keys(cookie.keys);
                        columnNames.forEach(function(colName) {
                            var colValue = cookie.keys[colName];
                            recordEditModel.submissionRows[newRow][colName] = colValue;
                        });
                    }
                    $log.info('Model: ', recordEditModel);
                    // Keep a copy of the initial rows data so that we can see if user has made any changes later
                    recordEditModel.oldRows = angular.copy(recordEditModel.rows);
                    $log.info('Old model.rows:', recordEditModel.oldRows);
                }

                $rootScope.reference.columns.forEach(function (column, index) {
                    recordEditModel.columnModels[index] = {
                        allInput: null,
                        column: column,
                        inputType: recordEditAppUtils.columnToInputType(column, $rootScope.cookieObj),
                        highlightRow: false,
                        showSelectAll: false
                    };
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

                        var readAction = context.mode == context.modes.EDIT ? logActions.preUpdate : logActions.preCopy;
                        $rootScope.reference.read(numberRowsToRead, {action: readAction}).then(function getPage(page) {
                            $log.info("Page: ", page);

                            if (page.tuples.length < 1) {
                                // TODO: understand the filter that was used and relate that information to the user (it oucld be a facet filter now)
                                var recordSetLink = page.reference.unfilteredReference.contextualize.compact.appLink;
                                var tableDisplayName = page.reference.displayname.value;

                                throw new Errors.noRecordError({}, tableDisplayName, recordSetLink);
                            }

                            var column, value;


                            // $rootScope.tuples is used for keeping track of changes in the tuple data before it is submitted for update
                            $rootScope.tuples = [];
                            if ((context.mode != context.modes.EDIT || page.tuples.length > 1)) {
                                $rootScope.tableComment = $rootScope.reference.table.comment;
                            } else {
                                $rootScope.displayname = page.tuples[0].displayname;
                                $rootScope.tableComment = $rootScope.reference.table.comment;
                            }
                            $rootScope.tableDisplayName = $rootScope.reference.displayname;

                            for (var j = 0; j < page.tuples.length; j++) {
                                // initialize row objects {column-name: value,...}
                                recordEditModel.rows[j] = {};
                                // needs to be initialized so foreign keys can be set
                                recordEditModel.submissionRows[j] = {};

                                var tuple = page.tuples[j],
                                    values = tuple.values;

                                // attach the foreign key data of the tuple
                                recordEditModel.foreignKeyData[j] = tuple.linkedData;

                                // We don't want to mutate the actual tuples associated with the page returned from `reference.read`
                                // The submission data is copied back to the tuples object before submitted in the PUT request
                                var shallowTuple = tuple.copy();
                                $rootScope.tuples.push(shallowTuple);

                                for (var i = 0; i < $rootScope.reference.columns.length; i++) {
                                    column = $rootScope.reference.columns[i];
                                    var colModel = recordEditModel.columnModels[i];

                                    // If input is disabled, and it's copy, we don't want to copy the value
                                    if (colModel.inputType == "disabled" && context.mode == context.modes.COPY) continue;

                                    // Transform column values for use in view model
                                    var options = { outputType: "object" }
                                    switch (column.type.name) {
                                        case "timestamp":
                                            // If input is disabled, there's no need to transform the column value.
                                            value = colModel.inputType == "disabled" ? values[i] : InputUtils.formatDatetime(values[i], options);
                                            break;
                                        case "timestamptz":
                                            if (colModel.inputType == "disabled") {
                                                options.outputType = "string";
                                                options.outputMomentFormat = dataFormats.datetime.return;
                                            }
                                            value = InputUtils.formatDatetime(values[i], options);
                                            break;
                                        case "int2":
                                        case "int4":
                                        case "int8":
                                            // If input is disabled, there's no need to transform the column value.
                                            value = colModel.inputType == "disabled" ? values[i] : InputUtils.formatInt(values[i]);
                                            break;
                                        case "float4":
                                        case "float8":
                                        case "numeric":
                                            // If input is disabled, there's no need to transform the column value.
                                            value = colModel.inputType == "disabled" ? values[i] : InputUtils.formatFloat(values[i]);
                                            break;
                                        default:
                                            // the structure for asset type columns is an object with a 'url' property
                                            if (column.isAsset && colModel.inputType !== "disabled") {
                                                value = { url: values[i] || "" };
                                            } else {
                                                value = values[i];
                                            }
                                            break;
                                    }

                                    // no need to check for copy here because the case above guards against the negative case for copy
                                    recordEditModel.rows[j][column.name] = value;
                                }
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
                        $rootScope.tableDisplayName = $rootScope.reference.displayname;
                        $rootScope.tableComment = $rootScope.reference.table.comment;

                        // populate defaults
                        for (var i = 0; i < $rootScope.reference.columns.length; i++) {
                            // default model initialiation is null
                            var initialModelValue = null;
                            var column = $rootScope.reference.columns[i];
                            var colModel = recordEditModel.columnModels[i];

                            // check the recordEditModel to see if the value was set because of a prefill condition
                            if (recordEditModel.rows[0][column.name]) continue;

                            // only want to set primitive values in the input fields so make sure it isn't a function, null, or undefined
                            var defaultSet = (column.default !== undefined && column.default !== null);

                            var tsOptions = {
                                outputType: colModel.inputType == "disabled" ? "string" : "object",

                            }
                            switch (column.type.name) {
                                // timestamp[tz] and asset columns have default model objects if their inputs are NOT disabled
                                case 'timestamp':
                                    tsOptions.outputMomentFormat = dataFormats.datetime.display;
                                    // formatDatetime takes care of column.default if null || undefined
                                    initialModelValue = InputUtils.formatDatetime(column.default, tsOptions);
                                    break;
                                case 'timestamptz':
                                    tsOptions.outputMomentFormat = dataFormats.datetime.displayZ;
                                    // formatDatetime takes care of column.default if null || undefined
                                    initialModelValue = InputUtils.formatDatetime(column.default, tsOptions);
                                    break;
                                default:
                                    if (column.isAsset) {
                                        initialModelValue = InputUtils.formatFile(column.default, colModel.inputType == "disabled" ? "string" : "object");
                                    } else if (column.isForeignKey) {
                                        if (defaultSet) {
                                            initialModelValue = column.default;

                                            // initialize foreignKey data
                                            recordEditModel.foreignKeyData[0][column.foreignKey.name] = column.defaultValues;

                                            // get the actual foreign key data
                                            getForeignKeyData(0, column.name, column.foreignKey.name, column.defaultReference, {action: logActions.recordeditDefault});
                                        }
                                    } else {
                                        // all other column types
                                        if (defaultSet) {
                                            initialModelValue = column.default;
                                        }
                                    }
                            }

                            recordEditModel.rows[0][column.name] = initialModelValue;
                        }

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


        /**
         * In case of prefill and default we only have a reference to the foreignkey,
         * we should do extra reads to get the actual data.
         *
         * @param  {int} rowIndex The row index that this data is for (it's usually zero, first row)
         * @param  {string} colName The name of the foreignkey pseudo column.
         * @param  {string} fkName  The constraint name of the foreign key
         * @param  {ERMrest.Refernece} fkRef   Reference to the foreign key table
         * @param  {Object} contextHeaderParams the object will be passed to read as contextHeaderParams
         */
        function getForeignKeyData (rowIndex, colName, fkName, fkRef, logObject) {
            fkRef.contextualize.compactSelect.read(1, logObject).then(function (page) {
                $rootScope.showColumnSpinner[rowIndex][colName] = true;
                if ($rootScope.showColumnSpinner[rowIndex][colName]) {
                    // default value is validated
                    if (page.tuples.length > 0) {
                        recordEditModel.foreignKeyData[rowIndex][colName] = page.tuples[rowIndex].data;
                        recordEditModel.rows[rowIndex][colName] = page.tuples[rowIndex].displayname.value;
                    } else {
                        recordEditModel.foreignKeyData[rowIndex][fkName] = null;
                        recordEditModel.rows[rowIndex][colName] = null;
                    }
                }
                $rootScope.showColumnSpinner[rowIndex][colName] = false;
            }).catch(function (err) {
                $rootScope.showColumnSpinner[rowIndex][colName] = false;
                $log.warn(err);
            });
        }

    }]);
})();
