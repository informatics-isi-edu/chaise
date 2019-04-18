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
        // Configure all tooltips to be attached to the body by default. To attach a
        // tooltip on the element instead, set the `tooltip-append-to-body` attribute
        // to `false` on the element.
        $uibTooltipProvider.options({appendToBody: true});
        // chaise configurations
        ConfigUtilsProvider.$get().setConfigJSON();
        //  Enable log system, if in debug mode
        $logProvider.debugEnabled(ConfigUtilsProvider.$get().getConfigJSON().debug === true);
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
        context.catalogID = UriUtils.getCatalogIDFromLocation();

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

        var res = UriUtils.chaiseURItoErmrestURI($window.location);
        var ermrestUri = res.ermrestUri, pcid = res.pcid, ppid = res.ppid, isQueryParameter = res.isQueryParameter;



        $rootScope.context = context;

        // will be used to determine the app mode (edit, create, or copy)
        // We are not passing the query parameters that are used for app mode,
        // so we cannot use the queryParams that parser is returning.
        context.queryParams = UriUtils.getQueryParams($window.location);

        // TODO we should remvoe ppid and pcid from the url. but what about the rest?

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


                // create the extra information that we want to log in ermrest (with the submission request)
                // NOTE currently we're only setting the action, we might need to add extra information here
                var logObj = {action: logActions.update};
                if (pcid) logObj.pcid = pcid;
                if (ppid) logObj.ppid = ppid;
                if (isQueryParameter) logObj.cqp = 1;
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

                $rootScope.reference.columns.forEach(function (column, index) {
                    var isDisabled = InputUtils.isDisabled(column);

                    recordEditModel.columnModels[index] = {
                        allInput: null,
                        column: column,
                        isDisabled: isDisabled,
                        inputType: recordEditAppUtils.columnToInputType(column, isDisabled),
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

                                    // stringify the returned array value
                                    if (column.type.isArray) {
                                        if (values[i] !== null) {
                                            recordEditModel.rows[j][column.name] = JSON.stringify(values[i], undefined, 2);
                                        }
                                        continue;
                                    }

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
                                                value = {
                                                    url: values[i] || "",
                                                    filename: tuple.data[column._filenameColumn.name]
                                                };
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

                        // get the prefilled values
                        var prefilledColumns = {}, prefilledFks = [];
                        if (context.queryParams.prefill) {
                            // get the cookie with the prefill value
                            var cookie = $cookies.getObject(context.queryParams.prefill);

                            // make sure cookie is correct
                            var hasAllKeys = cookie && ["keys", "constraintNames", "origUrl", "rowname"].every(function (k) {
                                return cookie.hasOwnProperty(k);
                            });
                            if (hasAllKeys) {
                                $rootScope.cookieObj = cookie;

                                // keep a record of freignkeys that are prefilled
                                prefilledFks = cookie.constraintNames;

                                // keep a record of columns that are prefilled
                                prefilledColumns = cookie.keys;

                                // process the list of prefilled foreignkeys to get additional data
                                processPrefilledForeignKeys(cookie.constraintNames, cookie.keys, cookie.origUrl, cookie.rowname);

                                // Keep a copy of the initial rows data so that we can see if user has made any changes later
                                recordEditModel.oldRows = angular.copy(recordEditModel.rows);
                            }
                        }

                        // populate defaults
                        for (var i = 0; i < $rootScope.reference.columns.length; i++) {
                            // default model initialiation is null
                            var initialModelValue = null;
                            var column = $rootScope.reference.columns[i];
                            var colModel = recordEditModel.columnModels[i];

                            // only want to set primitive values in the input fields so make sure it isn't a function, null, or undefined
                            var defaultValue = column.default;

                            // if it's a prefilled foreignkey, the value is already set
                            if (column.isForeignKey &&  prefilledFks.indexOf(column.name) !== -1) {
                                colModel.isDisabled = true;
                                colModel.inputType = "disabled";
                                continue;
                            }

                            // if the column is prefilled, get the prefilled value instead of default
                            if (column.name in prefilledColumns) {
                                defaultValue = prefilledColumns[column.name];
                                colModel.isDisabled = true;
                                colModel.inputType = "disabled";
                            }

                            var tsOptions = {
                                outputType: colModel.inputType == "disabled" ? "string" : "object"
                            };

                            switch (column.type.name) {
                                // timestamp[tz] and asset columns have default model objects if their inputs are NOT disabled
                                case 'timestamp':
                                    tsOptions.outputMomentFormat = dataFormats.datetime.display;
                                    // formatDatetime takes care of column.default if null || undefined
                                    initialModelValue = InputUtils.formatDatetime(defaultValue, tsOptions);
                                    break;
                                case 'timestamptz':
                                    tsOptions.outputMomentFormat = dataFormats.datetime.displayZ;
                                    // formatDatetime takes care of column.default if null || undefined
                                    initialModelValue = InputUtils.formatDatetime(defaultValue, tsOptions);
                                    break;
                                default:
                                    if (column.isAsset) {
                                        initialModelValue = InputUtils.formatFile(defaultValue, colModel.inputType == "disabled" ? "string" : "object");
                                    } else if (column.isForeignKey) {
                                        // if all the columns of the foreignkey are prefilled, use that instead of default
                                        var allPrefilled = column.foreignKey.colset.columns.every(function (col) {
                                            return prefilledColumns[col.name] != null;
                                        });

                                        if (allPrefilled) {
                                            var defaultDisplay = column.getDefaultDisplay(prefilledColumns);

                                            colModel.isDisabled = true;
                                            colModel.inputType = "disabled";
                                            initialModelValue = defaultDisplay.rowname.value;
                                            // initialize foreignKey data
                                            recordEditModel.foreignKeyData[0][column.foreignKey.name] = defaultDisplay.fkValues;
                                            // get the actual foreign key data
                                            getForeignKeyData(0, [column.name], defaultDisplay.reference, {action: logActions.preCreatePrefill});
                                        } else if (defaultValue != null) {
                                            initialModelValue = defaultValue;
                                            // initialize foreignKey data
                                            recordEditModel.foreignKeyData[0][column.foreignKey.name] = column.defaultValues;
                                            // get the actual foreign key data
                                            getForeignKeyData(0, [column.name], column.defaultReference, {action: logActions.recordeditDefault});
                                        }
                                    } else {
                                        // all other column types
                                        if (defaultValue != null) {
                                            initialModelValue = defaultValue;
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
         * @param  {string[]} colNames Array of foreignkey names that can be prefilled
         * @param  {ERMrest.Refernece} fkRef   Reference to the foreign key table
         * @param  {Object} contextHeaderParams the object will be passed to read as contextHeaderParams
         */
        function getForeignKeyData (rowIndex, colNames, fkRef, logObject) {
            fkRef.contextualize.compactSelect.read(1, logObject).then(function (page) {
                colNames.forEach(function (colName) {
                    $rootScope.showColumnSpinner[rowIndex][colName] = true;
                    if ($rootScope.showColumnSpinner[rowIndex][colName]) {
                        // default value is validated
                        if (page.tuples.length > 0) {
                            recordEditModel.foreignKeyData[rowIndex][colName] = page.tuples[rowIndex].data;
                            recordEditModel.rows[rowIndex][colName] = page.tuples[rowIndex].displayname.value;
                        } else {
                            recordEditModel.foreignKeyData[rowIndex][colName] = null;
                            recordEditModel.rows[rowIndex][colName] = null;
                        }
                    }

                    $rootScope.showColumnSpinner[rowIndex][colName] = false;
                });
            }).catch(function (err) {
                colNames.forEach(function (colName) {
                    $rootScope.showColumnSpinner[rowIndex][colName] = false;
                });
                $log.warn(err);
            });
        }

        /**
         * - Attach the values for foreignkeys and columns that are prefilled.
         * - Read the actual parent row in order to attach the foreignkeyData
         * @param  {string[]} constraintNames An array of the name of foreign key columns
         * @param  {Object} keys            key-value pair of raw values
         * @param  {string} origUrl         the parent url that should be resolved to get the complete row of data
         * @param  {Object} rowname         the default rowname that should be displayed
         */
        function processPrefilledForeignKeys(constraintNames, keys, origUrl, rowname) {
            var newRow = recordEditModel.rows.length - 1;

            constraintNames.forEach(function (cn) {
                // Update view model
                recordEditModel.rows[newRow][cn] = rowname.value;

                // show the spinner that means we're waiting for data.
                $rootScope.showColumnSpinner[newRow][cn] = true;
            });

            // get the actual foreignkey data
            ERMrest.resolve(origUrl, {cid: context.appName}).then(function (ref) {
                // the table that we're logging is not the same table in url (it's the referrer that is the same)
                var logObject = $rootScope.reference.defaultLogInfo;
                logObject.referrer = ref.defaultLogInfo;
                logObject.action = logActions.preCreatePrefill;
                getForeignKeyData(newRow, constraintNames, ref, logObject);
            }).catch(function (err) {
                $rootScope.showColumnSpinner[newRow][constraintName] = false;
                $log.warn(err);
            });

            // Update submission and row model
            for (var name in keys) {
                recordEditModel.rows[newRow][name] = keys[name];
                recordEditModel.submissionRows[newRow][name] = keys[name];
            }
        }
    }]);
})();
