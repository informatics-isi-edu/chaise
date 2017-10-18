(function() {
    'use strict';

    angular.module('chaise.recordEdit', [
        '720kb.datepicker',
        'chaise.alerts',
        'chaise.authen',
        'chaise.delete',
        'chaise.errors',
        'chaise.filters',
        'chaise.modal',
        'chaise.navbar',
        'chaise.upload',
        'chaise.record.table',
        'chaise.markdown',
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

    .config(['$cookiesProvider', function($cookiesProvider) {
        $cookiesProvider.defaults.path = '/';
    }])

    // Configure all tooltips to be attached to the body by default. To attach a
    // tooltip on the element instead, set the `tooltip-append-to-body` attribute
    // to `false` on the element.
    .config(['$uibTooltipProvider', function($uibTooltipProvider) {
        $uibTooltipProvider.options({appendToBody: true});
    }])

    .run(['AlertsService', 'ERMrest', 'errorNames', 'ErrorService', 'headInjector', 'MathUtils', 'recordEditModel', 'Session', 'UiUtils', 'UriUtils', '$log', '$rootScope', '$window', '$cookies', 'messageMap',
        function runRecordEditApp(AlertsService, ERMrest, errorNames, ErrorService, headInjector, MathUtils, recordEditModel, Session, UiUtils, UriUtils, $log, $rootScope, $window, $cookies, messageMap) {

        var session,
            context = { booleanValues: ['', true, false] };

        $rootScope.displayReady = false;

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

        ERMrest.appLinkFn(UriUtils.appTagToURL);

        // Subscribe to on change event for session
        var subId = Session.subscribeOnChange(function() {

            // Get existing session value
            session = Session.getSessionValue();

            // If session is not defined or null (Anonymous user) prompt the user to login
            if (!session) {
                var notAuthorizedError = new ERMrest.UnauthorizedError(messageMap.unauthorizedErrorCode, messageMap.unauthorizedMessage);
                throw notAuthorizedError;
                return;
            }

            // Unsubscribe onchange event to avoid this function getting called again
            Session.unsubscribeOnChange(subId);

            // On resolution
            ERMrest.resolve(ermrestUri, { cid: context.appName }).then(function getReference(reference) {
                
                
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

                // Case for creating an entity, with prefilled values
                if (context.queryParams.prefill) {
                    // get the cookie with the prefill value
                    var cookie = $cookies.getObject(context.queryParams.prefill);
                    $rootScope.cookieObj = cookie;
                    if (cookie) {
                        // Update view model
                        recordEditModel.rows[recordEditModel.rows.length - 1][cookie.constraintName] = cookie.rowname.value;

                        // Update submission model
                        var columnNames = Object.keys(cookie.keys);
                        columnNames.forEach(function(colName) {
                            var colValue = cookie.keys[colName];
                            recordEditModel.submissionRows[recordEditModel.submissionRows.length - 1][colName] = colValue;
                        });
                    }
                    $log.info('Model: ', recordEditModel);
                    // Keep a copy of the initial rows data so that we can see if user has made any changes later
                    recordEditModel.oldRows = angular.copy(recordEditModel.rows);
                    $log.info('Old model.rows:', recordEditModel.oldRows);
                }

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

                        $rootScope.reference.read(numberRowsToRead).then(function getPage(page) {
                            $log.info("Page: ", page);

                            if (page.tuples.length < 1) {
                                // TODO: understand the filter that was used and relate that information to the user (it oucld be a facet filter now)
                                var noDataError = ErrorService.noRecordError();
                                throw noDataError;
                            }

                            var column, value;

                            // $rootScope.tuples is used for keeping track of changes in the tuple data before it is submitted for update
                            $rootScope.tuples = [];
                            $rootScope.displayname = ((context.queryParams.copy || page.tuples.length > 1) ? $rootScope.reference.displayname : page.tuples[0].displayname);

                            for (var j = 0; j < page.tuples.length; j++) {
                                // initialize row objects {column-name: value,...}
                                recordEditModel.rows[j] = {};
                                // needs to be initialized so foreign keys can be set
                                recordEditModel.submissionRows[j] = {};

                                var tuple = page.tuples[j],
                                    values = tuple.values;

                                // We don't want to mutate the actual tuples associated with the page returned from `reference.read`
                                // The submission data is copied back to the tuples object before submitted in the PUT request
                                var shallowTuple = tuple.copy();
                                $rootScope.tuples.push(shallowTuple);

                                for (var i = 0; i < $rootScope.reference.columns.length; i++) {
                                    column = $rootScope.reference.columns[i];

                                    // If input is disabled, there's no need to transform the column value.
                                    if (column.getInputDisabled(context.appContext)) {
                                        // if not copy, populate the field without transforming it
                                        if (context.mode != context.modes.COPY) {
                                            recordEditModel.rows[j][column.name] = values[i];
                                        }
                                        continue;
                                    }

                                    // Transform column values for use in view model
                                    switch (column.type.name) {
                                        case "timestamp":
                                        case "timestamptz":
                                            if (values[i]) {
                                                var ts = moment(values[i]);
                                                value = {
                                                    date: ts.format('YYYY-MM-DD'),
                                                    time: ts.format('hh:mm:ss'),
                                                    meridiem: ts.format('A')
                                                };
                                            } else {
                                                value = {
                                                    date: null,
                                                    time: null,
                                                    meridiem: 'AM'
                                                };
                                            }
                                            break;
                                        case "int2":
                                        case "int4":
                                        case "int8":
                                            var intVal = parseInt(values[i], 10);
                                            value = (!isNaN(intVal) ? intVal : null);
                                            break;
                                        case "float4":
                                        case "float8":
                                        case "numeric":
                                            var floatVal = parseFloat(values[i]);
                                            value = (!isNaN(floatVal) ? floatVal : null);
                                            break;
                                        default:
                                            if (column.isAsset) {
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
                            throw response;
                        });
                    } else if (session) {
                        var forbiddenError = new ERMrest.ForbiddenError(messageMap.unauthorizedErrorCode, messageMap.unauthorizedMessage);
                        // user logged in but not allowed (forbidden)
                        throw forbiddenError;
                    } else {
                        var notAuthorizedError = new ERMrest.UnauthorizedError(messageMap.unauthorizedErrorCode, messageMap.unauthorizedMessage)
                        // user not logged in (unauthorized)
                        throw notAuthorizedError;
                    }
                } else if (context.mode == context.modes.CREATE) {
                    if ($rootScope.reference.canInsert) {
                        $rootScope.displayname = $rootScope.reference.displayname;

                        // populate defaults
                        for (var i = 0; i < $rootScope.reference.columns.length; i++) {
                            // default model initialiation is null
                            var initialModelValue = null;
                            var column = $rootScope.reference.columns[i];

                            if (recordEditModel.rows[0][column.name]) {
                                // check the recordEditModel to see if the value was set because of a prefill condition
                                continue;
                            }

                            // only want to set primitive values in the input fields so make sure it isn't a function, null, or undefined
                            var defaultSet = (column.default !== undefined && column.default !== null);
                            // if no default is set, certain inputs have different model structures based on the input being disabled or not
                            var inputDisabled = (column.getInputDisabled(context.appContext));

                            // timestamp[tx] and asset columns have default model objects if their inputs are NOT disabled
                            if ((column.type.name === 'timestamp' || column.type.name === 'timestamptz')) {
                                // setup if column is type timestamp[tz]
                                if (defaultSet) {
                                    var ts = moment(column.default);
                                    if (inputDisabled) {
                                        initialModelValue = ( column.type.name === 'timestamp' ? ts.format("YYYY-MM-DD HH:mm:ss") : ts.format("YYYY-MM-DD HH:mm:ssZ") );
                                    } else {
                                        initialModelValue = { date: ts.format('YYYY-MM-DD'), time: ts.format('hh:mm:ss'), meridiem: ts.format('A') };
                                    }
                                } else if (!inputDisabled) {
                                    // If there are no defaults, then just initialize timestamp[tz] columns with the app's default obj
                                    initialModelValue = { date: null, time: null, meridiem: 'AM' };
                                }
                            } else if (column.isAsset) {
                                // setup if column is type asset
                                if (defaultSet) {
                                    initialModelValue = { url: column.default };
                                } else if (!inputDisabled) {
                                    // If there are no defaults, then just initialize asset columns with the app's default obj
                                    initialModelValue = { url: "" }
                                }
                            } else {
                                // all other column types
                                if (defaultSet) {
                                    initialModelValue = column.default;
                                }
                            }

                            recordEditModel.rows[0][column.name] = initialModelValue;
                        };

                        $rootScope.displayReady = true;
                        // if there is a session, user isn't allowed to create
                    } else if (session) {
                        var forbiddenError = new ERMrest.ForbiddenError(messageMap.unauthorizedErrorCode, messageMap.unauthorizedMessage);
                        throw forbiddenError;
                        // user isn't logged in and needs permissions to create
                    } else {
                        var notAuthorizedError = new ERMrest.UnauthorizedError(messageMap.unauthorizedErrorCode, messageMap.unauthorizedMessage);
                        throw notAuthorizedError;
                    }
                }
            }, function error(response) {
                throw response;
            });
        });

    }]);
})();
