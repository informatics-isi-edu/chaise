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
        'chaise.record.table',
        'chaise.utils',
        'chaise.validators',
        'chaise.html',
        'ermrestjs',
        'ngCookies',
        'ngMessages',
        'ngSanitize',
        'ui.bootstrap',
        'ui.mask',
        'ui.select'
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

    .run(['ERMrest', 'errorNames', 'ErrorService', 'headInjector', 'recordEditModel', 'Session', 'UiUtils', 'UriUtils', '$log', '$rootScope', '$window', '$cookies',
        function runRecordEditApp(ERMrest, errorNames, ErrorService, headInjector, recordEditModel, Session, UiUtils, UriUtils, $log, $rootScope, $window, $cookies) {

        var session,
            context = { booleanValues: ['', true, false] };

        UriUtils.setOrigin();
        headInjector.addTitle();
        headInjector.addCustomCSS();

        // This is to allow the dropdown button to open at the top/bottom depending on the space available
        UiUtils.setBootstrapDropdownButtonBehavior();
        UriUtils.setLocationChangeHandling();

        try {
            // If defined but false, throw an error
            if (!chaiseConfig.editRecord && chaiseConfig.editRecord !== undefined) {
                var message = 'Chaise is currently configured to disallow editing records. Check the editRecord setting in chaise-config.js.';
                var error = new Error(message);
                error.code = "Record Editing Disabled";

                throw error;
            }

            var ermrestUri = UriUtils.chaiseURItoErmrestURI($window.location);

            context = $rootScope.context = UriUtils.parseURLFragment($window.location, context);
            context.appName = "recordedit";
            context.MAX_ROWS_TO_ADD = 201;

            Session.getSession().then(function getSession(_session) {
                session = _session;
                ERMrest.appLinkFn(UriUtils.appTagToURL);

                return ERMrest.resolve(ermrestUri, {cid: context.appName});
            }, function sessionFailed() {
                // do nothing but return without a session
                return ERMrest.resolve(ermrestUri, {cid: context.appName});
            }).then(function getReference(reference) {
                $rootScope.reference = ((context.filter && !context.queryParams.copy) ? reference.contextualize.entryEdit : reference.contextualize.entryCreate);
                $rootScope.reference.session = session;
                $rootScope.session = session;

                $log.info("Reference: ", $rootScope.reference);

                // Case for creating an entity, with prefilled values
                if (context.queryParams.prefill) {
                    // get the cookie with the prefill value
                    var cookie = $cookies.getObject(context.queryParams.prefill);
                    if (cookie) {
                        // Update view model
                        recordEditModel.rows[recordEditModel.rows.length - 1][cookie.constraintName] = cookie.rowname;

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
                if (context.filter || context.queryParams.limit) {
                    if ($rootScope.reference.canUpdate) {
                        var numberRowsToRead;
                        if (context.queryParams.limit) {
                            numberRowsToRead = Number(context.queryParams.limit);
                        } else {
                            numberRowsToRead = context.MAX_ROWS_TO_ADD;
                        }
                        $rootScope.reference.read(numberRowsToRead).then(function getPage(page) {
                            $log.info("Page: ", page);

                            if (page.tuples.length < 1) {

                                var filters = context.filter.filters;
                                var noDataMessage = "No entity exists with ";
                                for (var k = 0; k < filters.length; k++) {
                                    noDataMessage += filters[k].column + filters[k].operator + filters[k].value;
                                    if (k != filters.length-1) {
                                        noDataMessage += " or ";
                                    }
                                }
                                var noDataError = new Error(noDataMessage);
                                noDataError.code = errorNames.notFound;

                                throw noDataError;
                            }

                            var column, value;

                            $rootScope.tuples = page.tuples;
                            $rootScope.displayname = ((context.queryParams.copy && page.tuples.length > 1) ? $rootScope.reference.displayname : page.tuples[0].displayname);

                            for (var j = 0; j < page.tuples.length; j++) {
                                // initialize row objects {column-name: value,...}
                                recordEditModel.rows[j] = {};
                                // needs to be initialized so foreign keys can be set
                                recordEditModel.submissionRows[j] = {};

                                var tuple = page.tuples[j],
                                    values = tuple.values;

                                for (var i = 0; i < $rootScope.reference.columns.length; i++) {
                                    column = $rootScope.reference.columns[i];

                                    switch (column.type.name) {
                                        case "timestamp":
                                        case "timestamptz":
                                            if (values[i]) {
                                                // Cannot ensure that all timestamp values are formatted in ISO 8601
                                                // TODO: Fix pretty print fn in ermrestjs to return ISO 8601 format instead of toLocaleString?
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
                                            value = (values[i] ? parseInt(values[i], 10) : '');
                                            break;
                                        case "float4":
                                        case "float8":
                                        case "numeric":
                                            value = (values[i] ? parseFloat(values[i]) : '');
                                            break;
                                        default:
                                            value = values[i];
                                            break;
                                    }

                                    if (!context.queryParams.copy || !column.getInputDisabled(context.appContext)) {
                                        recordEditModel.rows[j][column.name] = value;
                                    }
                                }
                            }
                            $log.info('Model: ', recordEditModel);
                            // Keep a copy of the initial rows data so that we can see if user has made any changes later
                            recordEditModel.oldRows = angular.copy(recordEditModel.rows);
                        }, function error(response) {
                            $log.warn(response);
                            throw response;
                        }).catch(function readCatch(exception) {
                            ErrorService.errorPopup(exception.message, exception.code, "home page");
                        });
                    } else if (session) {
                        var notAuthorizedMessage = "You are not authorized to Update entities.";
                        var notAuthorizedError = new Error(notAuthorizedMessage);
                        notAuthorizedError.code = errorNames.forbidden;

                        throw notAuthorizedError;
                    } else {
                        var notAuthorizedMessage = "You are not authorized to Update entities.";
                        var notAuthorizedError = new Error(notAuthorizedMessage);

                        notAuthorizedError.code = errorNames.unauthorized;

                        throw notAuthorizedError;
                    }
                } else {
                    if ($rootScope.reference.canCreate) {
                        $rootScope.displayname = $rootScope.reference.displayname;

                        // populate defaults
                        angular.forEach($rootScope.reference.columns, function(column) {
                            // if column.default == undefined, the second condition would be true so we need to check if column.default is defined
                            // only want to set values in the input fields so make sure it isn't a function
                            // check the recordEditModel to make sure a value wasn't already set based on the prefill condition
                            if (column.default && typeof column.default !== "function" && !recordEditModel.rows[0][column.name]) {
                                recordEditModel.rows[0][column.name] = column.default;
                            }
                        });
                    // if there is a session, user isn't allowed to create
                    } else if (session) {
                        var forbiddenMessage = "You are not authorized to Create entities.";
                        var forbiddenError = new Error(forbiddenMessage);

                        forbiddenError.code = errorNames.forbidden;

                        throw forbiddenError;
                    // user isn't logged in and needs permissions to create
                    } else {
                        var notAuthorizedMessage = "You are not authorized to Create entities.";
                        var notAuthorizedError = new Error(notAuthorizedMessage);

                        notAuthorizedError.code = errorNames.unauthorized;

                        throw notAuthorizedError;
                    }
                }
            }, function error(response) {
                $log.warn(response);
                throw response;
            }).catch(function genericCatch(exception) {
                if (exception instanceof ERMrest.UnauthorizedError || exception.code == errorNames.unauthorized) {
                    ErrorService.catchAll(exception);
                } else if (exception.code == errorNames.forbidden) {
                    ErrorService.errorPopup(exception.message, exception.code, "previous page", $window.document.referrer);
                } else {
                    ErrorService.errorPopup(exception.message, exception.code, "home page");
                }
            });
        } catch (exception) {
            ErrorService.errorPopup(exception.message, exception.code, "home page");
        }
    }]);
})();
