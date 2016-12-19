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
        $cookiesProvider.defaults.secure = true;
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

            Session.getSession().then(function getSession(_session) {
                session = _session;
                ERMrest.appLinkFn(UriUtils.appTagToURL);

                return ERMrest.resolve(ermrestUri, {cid: context.appName});
            }, function sessionFailed() {
                // do nothing but return without a session
                return ERMrest.resolve(ermrestUri, {cid: context.appName});
            }).then(function getReference(reference) {
                $rootScope.reference = ((context.filter && !context.copy) ? reference.contextualize.entryEdit : reference.contextualize.entryCreate);
                $rootScope.reference.session = session;

                $log.info("Reference: ", $rootScope.reference);

                // Case for creating an entity, with prefilled values
                if (context.prefill) {
                    // get the cookie with the prefill value
                    var cookie = $cookies.getObject(context.prefill);
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
                if (context.filter) {
                    if ($rootScope.reference.canUpdate) {
                        // check id range before reading?
                        $rootScope.reference.read(1).then(function getPage(page) {
                            $log.info("Page: ", page);

                            if (page.tuples.length < 1) {
                                var filter = context.filter;
                                var noDataMessage = "No entity exists with " + filter.column + filter.operator + filter.value;
                                var noDataError = new Error(noDataMessage);
                                noDataError.code = errorNames.notFound;

                                throw noDataError;
                            }

                            var column, value,
                                tuple = page.tuples[0],
                                values = tuple.values;

                            $rootScope.tuples = page.tuples;
                            $rootScope.displayname = (context.copy ? $rootScope.reference.displayname : tuple.displayname);

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
                                                meridiem: null
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

                                if (!context.copy || !column.getInputDisabled(context.appContext)) {
                                    recordEditModel.rows[recordEditModel.rows.length - 1][column.name] = value;
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
                    } else if (session) {
                        var forbiddenMessage = "You are not authorized to Create entities.";
                        var forbiddenError = new Error(forbiddenMessage);

                        forbiddenError.code = errorNames.forbidden;

                        throw forbiddenError;
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
