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
        'chaise.utils',
        'chaise.validators',
        'ermrestjs',
        'ngMessages',
        'ngSanitize',
        //'rzModule',
        'ui.bootstrap',
        'ui.select'
    ])

    .run(['ERMrest', 'ErrorService', 'headInjector', 'recordEditModel', 'UiUtils', 'UriUtils', '$log', '$rootScope', '$window', function runRecordEditApp(ERMrest, ErrorService, headInjector, recordEditModel, UiUtils, UriUtils, $log, $rootScope, $window) {
        var context = { booleanValues: ['', true, false] };
        UriUtils.setOrigin();
        headInjector.addTitle();
        headInjector.addCustomCSS();

        // This is to allow the dropdown button to open at the top/bottom depending on the space available
        UiUtils.setBootstrapDropdownButtonBehavior();
        UriUtils.setLocationChangeHandling();

        try {
            var ermrestUri = UriUtils.chaiseURItoErmrestURI($window.location);

            context = $rootScope.context = UriUtils.parseURLFragment($window.location, context);
            context.appName = "recordedit";

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

            ERMrest.resolve(ermrestUri, {cid: context.appName}).then(function getReference(reference) {
                $rootScope.reference = (context.filter ? reference.contextualize.entryEdit : reference.contextualize.entryCreate);
                $rootScope.reference.session = $rootScope.session;

                $log.info("Reference: ", $rootScope.reference);

                // Case for editing an entity
                if (context.filter) {
                    // check id range before reading?
                    $rootScope.reference.read(1).then(function getPage(page) {
                        var column, value,
                            tuple = page.tuples[0],
                            values = tuple.values;

                        $rootScope.tuples = page.tuples;
                        $rootScope.displayname = tuple.displayname;

                        for (var i = 0; i < $rootScope.reference.columns.length; i++) {
                            column = $rootScope.reference.columns[i];

                            switch (column.type.name) {
                                case "timestamptz":
                                case "date":
                                    value = (values[i] ? new Date(values[i]) : '');
                                    break;
                                case "int2":
                                case "int4":
                                case "int8":
                                case "float4":
                                case "float8":
                                case "numeric":
                                    value = (values[i] ? parseInt(values[i], 10) : '');
                                    break;
                                default:
                                    value = values[i];
                                    break;
                            }

                            recordEditModel.rows[recordEditModel.rows.length - 1][column.name] = value;
                        }
                    }, function error(response) {
                        $log.warn(response);
                        throw reponse;
                    });
                } else {
                    $rootScope.displayname = $rootScope.reference.displayname;
                }
            }, function error(response) {
                $log.warn(response);
                throw response;
            }).catch(function genericCatch(exception) {
                ErrorService.catchAll(exception);
            });
        } catch (exception) {
            ErrorService.errorPopup(exception.message, exception.code, "home page");
        }
    }]);


/* Everything below this line is from before refactoring the record edit app */
/* ======================================================================================================================================= */
    // Configure the context info from the URI
    // .config(['context', 'UriUtilsProvider', function configureContext(context, UriUtilsProvider) {
    //     var utils = UriUtilsProvider.$get();
    //
    //     // Parse the URL
    //     utils.setOrigin();
    //     utils.parseURLFragment(window.location, context);
    //
    //     console.log('Context:',context);
    // }])
    //
    // .run(['headInjector', 'context', 'ERMrest', 'recordEditModel', 'AlertsService', 'ErrorService', 'Session', 'UriUtils', '$log', '$uibModal', '$window',
    // function runApp(headInjector, context, ERMrest, recordEditModel, AlertsService, ErrorService, Session, UriUtils, $log, $uibModal, $window) {
    //     headInjector.addTitle();
    //     headInjector.addCustomCSS();
    //
    //     if (!chaiseConfig.editRecord  && chaiseConfig.editRecord !== undefined) {
    //         var modalInstance = $uibModal.open({
    //             controller: 'ErrorDialogController',
    //             controllerAs: 'ctrl',
    //             size: 'sm',
    //             templateUrl: '../common/templates/errorDialog.html',
    //             backdrop: 'static',
    //             keyboard: false,
    //             resolve: {
    //                 params: {
    //                     title: 'Record Editing Disabled',
    //                     message: 'Chaise is currently configured to disallow editing records. Check the editRecord setting in chaise-config.js.'
    //                 }
    //             }
    //         });
    //
    //         modalInstance.result.then(function() {
    //             $window.location.href = chaiseConfig.dataBrowser ? chaiseConfig.dataBrowser : $window.location.origin;
    //         });
    //     }
    //     // generic try/catch
    //     try {
    //         var server = context.server = ERMrest.ermrestFactory.getServer(context.serviceURL, {cid: context.appName});
    //     } catch (exception) {
    //         ErrorService.catchAll(exception);
    //     }
    //     server.catalogs.get(context.catalogID).then(function success(catalog) {
    //         try {
    //             var schema = catalog.schemas.get(context.schemaName); // caught by generic exception case
    //             var table = schema.tables.get(context.tableName); // caught by generic exception case
    //
    //             console.log('Table:', table);
    //             recordEditModel.table = table;
    //
    //             var foreignKeys = table.foreignKeys.all(); // caught by generic exception case
    //             angular.forEach(foreignKeys, function(fkey) {
    //                 // simple implies one column
    //                 if (fkey.simple) {
    //                     var ftable = fkey.key.table;
    //                     var keyColumn = fkey.key.colset.columns[0];
    //
    //                     /* FIRST USE CASE: covered by default; display = key column */
    //
    //                     var pattern = "{" + keyColumn.name + "}";
    //                     var displayColumns = [keyColumn];
    //
    //                     /* SECOND USE CASE: conditional if the table is tagged as a vocabulary */
    //
    //                     try {
    //                         var vocabAnnotationTag = "tag:misd.isi.edu,2015:vocabulary";
    //                         var displayAnnotationTag = "tag:misd.isi.edu,2015:display";
    //
    //                         if (ftable.annotations.contains(vocabAnnotationTag)) {
    //                             // no need to catch this, using `.contains` verifies it exists or not
    //                             // if an exception is thrown at this point it will be caught by generic exception case
    //                             var vocabAnnotation = ftable.annotations.get(vocabAnnotationTag);
    //                             if (vocabAnnotation.content.term) {
    //                                 var termColumn = ftable.columns.get(vocabAnnotation.content.term); // caught by generic exception case
    //                                 displayColumns.push(termColumn); // the array is now [keyColumn, termColumn]
    //                             }
    //                             // vocabulary term is undefined
    //                             else {
    //                                 var ftableColumns = ftable.columns.all(); // caught by generic exception case
    //                                 for (var i = 0, length = ftableColumns.length; i < length; i++) {
    //                                     var uppColumnName = ftableColumns[i].name.toUpperCase();
    //                                     if (uppColumnName == 'TERM' || uppColumnName == 'NAME') {
    //                                         displayColumns.push(ftableColumns[i]);
    //                                         break;
    //                                     }
    //                                 } /* term undefined */
    //                             }
    //                             if (displayColumns.length > 1) {
    //                                 pattern = "{" + displayColumns[1].name + "}";
    //                             }
    //                             /* END USE CASE 2 */
    //                         }
    //                         /* THIRD USE CASE: not a vocabulary but it has a “display : row name” annotation */
    //                         /* Git issue #358 */
    //                         else if (ftable.annotations.contains(displayAnnotationTag)) {
    //                             // no need to catch this, using `.contains` verifies it exists or not
    //                             // if an exception is thrown at this point it will be caught by generic exception case
    //                             var displayAnnotation = ftable.annotations.get(displayAnnotationTag);
    //                             if (displayAnnotation.content.row_name) {
    //                                 // TODO
    //                                 // var array_of_col_names = REGEX THE array of column_name strings from “ … `{` column_name `}` …” patterns
    //                                 // angular.forEach(array_of_col_names, function(column_name) {
    //                                 //     displayColumns.push(table.columns.get(column_name));
    //                                 // });
    //                                 //
    //                                 // pattern = displayAnnotation.row_name;
    //                             }
    //                         }
    //                     } finally {
    //                         (function(fkey) {
    //                             ftable.entity.get(null, null, displayColumns).then(function success(rowset) {
    //                                 var domainValues = recordEditModel.domainValues[fkey.colset.columns[0].name] = [];
    //                                 var displayColumnName = (displayColumns[1] ? displayColumns[1].name : keyColumn.name);
    //
    //                                 angular.forEach(rowset.data, function(column) {
    //                                     domainValues.push( {key: column[keyColumn.name], display: column[displayColumnName]/*Util.patternExpansion( pattern, column.data )*/} );
    //                                 });
    //                             }, function error(response) {
    //                                 // shouldn't error out
    //                                 $log.info(response);
    //                             });
    //                         })(fkey);
    //                     }
    //                 }
    //             });
    //
    //             // If there are filters, populate the model with existing records' column values
    //             if (context.filter && (context.filter.type === "BinaryPredicate" || context.filter.type === "Conjunction")) {
    //                 var path = new ERMrest.DataPath(table);
    //                 // TODO: Store filters in URI form in model to use later on form submission
    //                 var filterString = UriUtils.parsedFilterToERMrestFilter(context.filter, table);
    //                 // recordEditModel.filterUri = filterString.toUri();
    //
    //                 var path = path.filter(filterString);
    //                 path.entity.get().then(function success(entity) {
    //                     if (entity.length === 0) {
    //                         AlertsService.addAlert({type: 'error', message: 'Sorry, the requested record was not found. Please check the URL and refresh the page.' });
    //                         console.log('The requested record in schema ' + context.schemaName + ', table ' + context.tableName + ' with the following attributes: ' + context.filter + ' was not found.');
    //                     }
    //
    //                     angular.forEach(entity[0], function(value, colName) {
    //                         try {
    //                             var pathColumnType = path.context.columns.get(colName).column.type.name;
    //                             if (pathColumnType == 'date' || pathColumnType == 'timestamptz') {
    //                                 // Must transform the value into a Date so that
    //                                 // Angular won't complain when putting the value
    //                                 // in an input of type "date" in the view
    //                                 value = (value) ? new Date(value) : "";
    //                             }
    //                             recordEditModel.rows[recordEditModel.rows.length - 1][colName] = value;
    //                         } catch (exception) { }
    //                     });
    //                 });
    //             }
    //             console.log('Model:',recordEditModel);
    //
    //         } catch (exception) { // handle generic catch
    //
    //             // ideally this would be used for Table/Schema not found instead of in general case
    //             if (exception instanceof ERMrest.NotFoundError) {
    //                 $log.info(exception);
    //                 ErrorService.errorPopup(exception.message, exception.code, "home page");
    //             }
    //
    //             throw exception;
    //         }
    //
    //     }, function error(response) { // error promise for server.catalogs.get()
    //         // for not found and bad request
    //         if (response instanceof ERMrest.NotFoundError || response instanceof ERMrest.BadRequestError) {
    //             $log.info(exception);
    //             ErrorService.errorPopup(response.message, response.code, "home page");
    //         }
    //
    //         throw response;
    //     }).catch(function(exception) {
    //         ErrorService.catchAll(exception);
    //     });
    // }]);

    // Refresh the page when the window's hash changes. Needed because Angular
    // normally doesn't refresh page when hash changes.
    // window.onhashchange = function() {
    //     if (window.location.hash != '#undefined') {
    //         location.reload();
    //     } else {
    //         history.replaceState("", document.title, window.location.pathname);
    //         location.reload();
    //     }
    //     function goBack() {
    //         window.location.hash = window.location.lasthash[window.location.lasthash.length-1];
    //         window.location.lasthash.pop();
    //     }
    // }
})();
