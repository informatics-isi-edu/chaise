(function() {
    'use strict';

    angular.module('chaise.recordEdit', [
        'ermrestjs',
        'ngSanitize',
        'chaise.utils',
        'chaise.authen',
        'chaise.navbar',
        'chaise.errors',
        'chaise.alerts',
        'chaise.filters',
        'chaise.validators',
        'chaise.delete',
        'ui.bootstrap',
        'chaise.modal',
        'ui.select',
        'ui.bootstrap',
        'ui.mask',
        'ngMessages'
    ])

    // Configure the context info from the URI
    .config(['context', 'UriUtilsProvider', function configureContext(context, UriUtilsProvider) {
        var utils = UriUtilsProvider.$get();

        // Parse the URL
        utils.setOrigin();
        utils.parseURLFragment(window.location, context);

        console.log('Context:',context);
    }])

    .run(['headInjector', 'context', 'ERMrest', 'recordEditModel', 'AlertsService', 'ErrorService', 'Session', 'UriUtils', '$log', '$uibModal', '$window', function runApp(headInjector, context, ERMrest, recordEditModel, AlertsService, ErrorService, Session, UriUtils, $log, $uibModal, $window) {
        headInjector.addTitle();
        headInjector.addCustomCSS();

        if (!chaiseConfig.editRecord  && chaiseConfig.editRecord !== undefined) {
            var modalInstance = $uibModal.open({
                controller: 'ErrorDialogController',
                controllerAs: 'ctrl',
                size: 'sm',
                templateUrl: '../common/templates/errorDialog.html',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    params: {
                        title: 'Record Editing Disabled',
                        message: 'Chaise is currently configured to disallow editing records. Check the editRecord setting in chaise-config.js.'
                    }
                }
            });

            modalInstance.result.then(function() {
                $window.location.href = chaiseConfig.dataBrowser ? chaiseConfig.dataBrowser : $window.location.origin;
            });
        }
        // generic try/catch
        try {
            var server = context.server = ERMrest.ermrestFactory.getServer(context.serviceURL, {cid: context.appName});
        } catch (exception) {
            ErrorService.catchAll(exception);
        }
        server.catalogs.get(context.catalogID).then(function success(catalog) {
            try {
                var schema = catalog.schemas.get(context.schemaName); // caught by generic exception case
                var table = schema.tables.get(context.tableName); // caught by generic exception case

                console.log('Table:', table);
                recordEditModel.table = table;

                var foreignKeys = table.foreignKeys.all(); // caught by generic exception case
                angular.forEach(foreignKeys, function(fkey) {
                    // simple implies one column
                    if (fkey.simple) {
                        var ftable = fkey.key.table;
                        var keyColumn = fkey.key.colset.columns[0];

                        /* FIRST USE CASE: covered by default; display = key column */

                        var pattern = "{" + keyColumn.name + "}";
                        var displayColumns = [keyColumn];

                        /* SECOND USE CASE: conditional if the table is tagged as a vocabulary */

                        try {
                            var vocabAnnotationTag = "tag:misd.isi.edu,2015:vocabulary";
                            var displayAnnotationTag = "tag:misd.isi.edu,2015:display";

                            if (ftable.annotations.contains(vocabAnnotationTag)) {
                                // no need to catch this, using `.contains` verifies it exists or not
                                // if an exception is thrown at this point it will be caught by generic exception case
                                var vocabAnnotation = ftable.annotations.get(vocabAnnotationTag);
                                if (vocabAnnotation.content.term) {
                                    var termColumn = ftable.columns.get(vocabAnnotation.content.term); // caught by generic exception case
                                    displayColumns.push(termColumn); // the array is now [keyColumn, termColumn]
                                }
                                // vocabulary term is undefined
                                else {
                                    var ftableColumns = ftable.columns.all(); // caught by generic exception case
                                    for (var i = 0, length = ftableColumns.length; i < length; i++) {
                                        var uppColumnName = ftableColumns[i].name.toUpperCase();
                                        if (uppColumnName == 'TERM' || uppColumnName == 'NAME') {
                                            displayColumns.push(ftableColumns[i]);
                                            break;
                                        }
                                    } /* term undefined */
                                }
                                if (displayColumns.length > 1) {
                                    pattern = "{" + displayColumns[1].name + "}";
                                }
                                /* END USE CASE 2 */
                            }
                            /* THIRD USE CASE: not a vocabulary but it has a “display : row name” annotation */
                            /* Git issue #358 */
                            else if (ftable.annotations.contains(displayAnnotationTag)) {
                                // no need to catch this, using `.contains` verifies it exists or not
                                // if an exception is thrown at this point it will be caught by generic exception case
                                var displayAnnotation = ftable.annotations.get(displayAnnotationTag);
                                if (displayAnnotation.content.row_name) {
                                    // TODO
                                    // var array_of_col_names = REGEX THE array of column_name strings from “ … `{` column_name `}` …” patterns
                                    // angular.forEach(array_of_col_names, function(column_name) {
                                    //     displayColumns.push(table.columns.get(column_name));
                                    // });
                                    //
                                    // pattern = displayAnnotation.row_name;
                                }
                            }
                        } finally {
                            (function(fkey) {
                                ftable.entity.get(null, null, displayColumns).then(function success(rowset) {
                                    var domainValues = recordEditModel.domainValues[fkey.colset.columns[0].name] = [];
                                    var displayColumnName = (displayColumns[1] ? displayColumns[1].name : keyColumn.name);

                                    angular.forEach(rowset.data, function(column) {
                                        domainValues.push( {key: column[keyColumn.name], display: column[displayColumnName]/*Util.patternExpansion( pattern, column.data )*/} );
                                    });
                                }, function error(response) {
                                    // shouldn't error out
                                    $log.info(response);
                                });
                            })(fkey);
                        }
                    }
                });

                // If there are filters, populate the model with existing records' column values
                if (context.filter && (context.filter.type === "BinaryPredicate" || context.filter.type === "Conjunction")) {
                    var path = new ERMrest.DataPath(table);
                    // TODO: Store filters in URI form in model to use later on form submission
                    var filterString = UriUtils.parsedFilterToERMrestFilter(context.filter, table);
                    // recordEditModel.filterUri = filterString.toUri();

                    var path = path.filter(filterString);
                    path.entity.get().then(function success(entity) {
                        if (entity.length === 0) {
                            AlertsService.addAlert({type: 'error', message: 'Sorry, the requested record was not found. Please check the URL and refresh the page.' });
                            console.log('The requested record in schema ' + context.schemaName + ', table ' + context.tableName + ' with the following attributes: ' + context.filter + ' was not found.');
                        }

                        angular.forEach(entity[0], function(value, colName) {
                            try {
                                var pathColumnType = path.context.columns.get(colName).column.type.name;
                                // Transform columns with date/timestamp values
                                if (pathColumnType == 'timestamp' || pathColumnType == 'timestamptz') {
                                    // e.g. timestamptz format 2016-09-26T11:17:28.696-07:00
                                    if (value) {
                                        var ts = moment(value, moment.ISO_8601, true);
                                        value = {
                                            date: ts.format('YYYY-MM-DD'),
                                            time: ts.format('hh:mm:ss'),
                                            meridiem: ts.format('A')
                                        };
                                    } else {
                                        value = {
                                            date: null,
                                            time: null
                                        };
                                    }
                                }
                                recordEditModel.rows[recordEditModel.rows.length - 1][colName] = value;
                            } catch (exception) { }
                        });
                    });
                }
                console.log('Model:',recordEditModel);

            } catch (exception) { // handle generic catch

                // ideally this would be used for Table/Schema not found instead of in general case
                if (exception instanceof ERMrest.NotFoundError) {
                    $log.info(exception);
                    ErrorService.errorPopup(exception.message, exception.code, "home page");
                }

                throw exception;
            }

        }, function error(response) { // error promise for server.catalogs.get()
            // for not found and bad request
            if (response instanceof ERMrest.NotFoundError || response instanceof ERMrest.BadRequestError) {
                $log.info(exception);
                ErrorService.errorPopup(response.message, response.code, "home page");
            }

            throw response;
        }).catch(function(exception) {
            ErrorService.catchAll(exception);
        });
    }]);

    // Refresh the page when the window's hash changes. Needed because Angular
    // normally doesn't refresh page when hash changes.
    window.onhashchange = function() {
        if (window.location.hash != '#undefined') {
            location.reload();
        } else {
            history.replaceState("", document.title, window.location.pathname);
            location.reload();
        }
        function goBack() {
            window.location.hash = window.location.lasthash[window.location.lasthash.length-1];
            window.location.lasthash.pop();
        }
    }
})();
