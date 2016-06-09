(function() {
    'use strict';

    angular.module('chaise.dataEntry', [
        'ERMrest',
        'ngSanitize',
        'chaise.utils',
        'chaise.navbar',
        'chaise.errors',
        'chaise.alerts',
        'chaise.filters',
        'chaise.interceptors',
        'chaise.validators',
        'ui.select',
        'rzModule',
        '720kb.datepicker',
        'ngMessages'
    ])

    // Configure the context info from the URI
    .config(['context', '$httpProvider', function configureContext(context, $httpProvider) {
        $httpProvider.interceptors.push('Interceptors');

        if (chaiseConfig.headTitle !== undefined) {
            document.getElementsByTagName('head')[0].getElementsByTagName('title')[0].innerHTML = chaiseConfig.headTitle;
        }

        // Parse the url
        context.serviceURL = window.location.origin + '/ermrest';
        if (chaiseConfig.ermrestLocation) {
            context.serviceURL = chaiseConfig.ermrestLocation + '/ermrest';
        }

        var hash = window.location.hash;

        if (hash === undefined || hash == '' || hash.length == 1) {
            return;
        }

        var parts = hash.substring(1).split('/');
        context.catalogID = parts[0];
        if (parts[1]) {
            var params = parts[1].split(':');
            if (params.length > 1) {
                context.schemaName = decodeURIComponent(params[0]);
                context.tableName = decodeURIComponent(params[1]);
            } else {
                context.tableName = decodeURIComponent(params[0]);
            }
        }

        // If there are filters appended to the URL, add them to context.js
        if (parts[2]) {
            context.filters = {};
            var filters = parts[2].split('&');
            for (var i = 0, len = filters.length; i < len; i++) {
                var filter = filters[i].split('=');
                if (filter[0] && filter[1]) {
                    context.filters[decodeURIComponent(filter[0])] = decodeURIComponent(filter[1]);
                }
            }
        }
        console.log('Context:',context);
    }])

    .run(['context', 'ermrestServerFactory', 'dataEntryModel', 'AlertsService', 'ErrorService', '$log', function runApp(context, ermrestServerFactory, dataEntryModel, AlertsService, ErrorService, $log) {
        try {
            var server = context.server = ermrestServerFactory.getServer(context.serviceURL);
        } catch (exception) {
            // The domain is typed incorrectly or does not exist ....?
            $log.info(exception);
        }
        server.catalogs.get(context.catalogID).then(function success(catalog) {
            try {
                var schema = catalog.schemas.get(context.schemaName);
                try {
                    var table = schema.tables.get(context.tableName);

                    console.log('Table:', table);
                    dataEntryModel.table = table;

                    // generic try/catch
                    try {
                        var foreignKeys = table.foreignKeys.all();
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
                                    try {
                                        var vocabAnnotation = ftable.annotations.get("tag:misd.isi.edu,2015:vocabulary");
                                    // An error being caught means the `vocabulary` annotation is not defined and that's okay
                                    } catch (exception) { }

                                    try {
                                        var displayAnnotation = ftable.annotations.get("tag:misd.isi.edu,2015:display");
                                    // An error being caught means the `display` annotation is not defined and that's okay
                                    } catch (exception) { }

                                    if (vocabAnnotation) {
                                        if (vocabAnnotation.content.term) {
                                            var termColumn = ftable.columns.get(vocabAnnotation.content.term);
                                            displayColumns.push(termColumn); // the array is now [keyColumn, termColumn]
                                        }
                                        // vocabulary term is undefined
                                        else {
                                            try {
                                                var ftableColumns = ftable.columns.all();
                                                for (var i = 0, length = ftableColumns.length; i < length; i++) {
                                                    var uppColumnName = ftableColumns[i].name.toUpperCase();
                                                    if (uppColumnName == 'TERM' || uppColumnName == 'NAME') {
                                                        displayColumns.push(ftableColumns[i]);
                                                        break;
                                                    }
                                                } /* term undefined */
                                            } catch (exception) {
                                                // ftable.columns.all() should not fail
                                                $log.info(exception);
                                            }
                                        }
                                        if (displayColumns.length > 1) {
                                            pattern = "{" + displayColumns[1].name + "}";
                                        }
                                        /* END USE CASE 2 */
                                    }
                                    /* THIRD USE CASE: not a vocabulary but it has a “display : row name” annotation */
                                    /* Git issue #358 */
                                    else if (displayAnnotation) {
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
                                            var domainValues = dataEntryModel.domainValues[fkey.colset.columns[0].name] = [];
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
                    } catch (exception) { // catches table.foreignKays.all()
                        // this shouldn't error out
                        $log.info(exception);
                    }

                    // If there are filters, populate the model with existing records' column values
                    if (context.filters) {
                        var path = new ERMrest.DataPath(table);
                        var filters = [];
                        angular.forEach(context.filters, function(value, key) {
                            try {
                                var column = path.context.columns.get(key);
                                filters.push(new ERMrest.BinaryPredicate(column, ERMrest.OPERATOR.EQUAL, value));
                            } catch (exception) {
                                // handle error
                            }
                        });
                        // TODO: Store filters in URI form in model to use later on form submission
                        var filterString = new ERMrest.Conjunction(filters);
                        // dataEntryModel.filterUri = filterString.toUri();

                        var path = path.filter(filterString);
                        path.entity.get().then(function success(entity) {
                            if (entity.length === 0) {
                                AlertsService.addAlert({type: 'error', message: 'Sorry, the requested record was not found. Please check the URL and refresh the page.' });
                                console.log('The requested record in schema ' + context.schemaName + ', table ' + context.tableName + ' with the following attributes: ' + context.filters + ' was not found.');
                            }

                            angular.forEach(entity[0], function(value, colName) {
                                try {
                                    var pathColumnType = path.context.columns.get(colName).column.type.name;
                                    if (pathColumnType == 'date' || pathColumnType == 'timestamptz') {
                                        // Must transform the value into a Date so that
                                        // Angular won't complain when putting the value
                                        // in an input of type "date" in the view
                                        value = new Date(value);
                                    }
                                } catch (exception) {
                                    // should not error out
                                }
                                dataEntryModel.rows[dataEntryModel.rows.length - 1][colName] = value;
                            });
                        });
                    }
                    console.log('Model:',dataEntryModel);


                } catch (exception) { // catches schema.tables.get(table name)
                    console.log(exception);
                    if (exception instanceof Errors.NotFoundError) {
                        ErrorService.tableNotFound(context.tableName, exception);
                    }
                }
            } catch (exception) { // catches catalog.schemas.get(schema name)
                if (exception instanceof Errors.NotFoundError) {
                    ErrorService.schemaNotFound(context.schemaName, exception);
                }
            }
        }, function error(response) { // error promise for server.catalogs.get()
            console.log("Go auth spot:", response);
            // TODO verify this is handled via an interceptor by the function in the ErrorService
            // If the interceptor handles this, do nothing here
            // 401 should not be caught here.
            if (response.code == 401) {
                UriUtils.getGoauth(UriUtils.fixedEncodeURIComponent(window.location.href));
                $log.info(response);
            }

            // Not sure why this is getting an error promise instead of being caught by the try/catch
            if (response.code == 404) {
                ErrorService.catalogNotFound(context.catalogID, response);
            }
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
