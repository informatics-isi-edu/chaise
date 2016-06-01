(function() {
    'use strict';

    angular.module('chaise.dataEntry', [
        'ERMrest',
        'ngSanitize',
        'chaise.errors',
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

    .run(['context', 'ermrestServerFactory', 'dataEntryModel', '$http', '$filter', function runApp(context, ermrestServerFactory, dataEntryModel, $http, $filter) {
        var server = ermrestServerFactory.getServer(context.serviceURL);
        server.catalogs.get(context.catalogID).then(function success(catalog) {
            var schema = catalog.schemas.get(context.schemaName);
            if (schema) {
                var table = schema.tables.get(context.tableName);
                if (table) {
                    console.log('Table:', table);
                    dataEntryModel.table = table;
                    dataEntryModel.cols = table.columns.all();

                    var foreignKeys = table.foreignKeys.all();
                    angular.forEach(foreignKeys, function(key) {
                        // Capture the key from the containing for loop in a closure
                        // so that getDomainValues() has the correct key on success
                        if (key.simple) {
                            (function(key) {
                                key.getDomainValues().then(function success(values) {
                                    var domainValues = dataEntryModel.domainValues[key.colset.columns[0].name] = [];
                                    var table = key.key._table;
                                    var annotations = table.annotations.all();
                                    var termColumnName = null;


                                    // TODO need to figure out how to handle if mutiple annotations are present
                                    angular.forEach(annotations, function(annotation) {
                                        // there should only be one term annotation
                                        if (annotation.content.term) {
                                            termColumnName = annotation.content.term;
                                        }
                                    });
                                    // if a term annotation is defined
                                    if (termColumnName) {
                                        // do nothing and break out of "if"
                                    }
                                    // use the term column instead
                                    else if(table.columns._columns.Term) {
                                        termColumnName = "Term";
                                    }
                                    // next choice is name
                                    else if(table.columns._columns.Name) {
                                        termColumnName = "Name";
                                    }
                                    // find a column with unambigous text field ?
                                    else {
                                        // TODO
                                        // angular.forEach(table.columns.all(), function(column) {
                                        //
                                        // });
                                    };

                                    var foreignKeyTablePath = new ERMrest.DataPath(table);
                                    foreignKeyTablePath.entity.get().then(function success(entitySet) {
                                        angular.forEach(values.data, function(value) {
                                            var field = null;
                                            if (value[termColumnName]) {
                                                field = value;
                                            } else {
                                                var foreignKey = Object.keys(value)[0];
                                                // this returns a set
                                                var filteredSet = $filter('filter')(entitySet,
                                                    // checks that the foreign key and key are the same
                                                    function (_value, index, array) {
                                                        return _value[foreignKey] == value[foreignKey];
                                                    }
                                                );
                                                // there should only be one
                                                field = filteredSet[0];
                                            }
                                            // push the annotation defined field from foreign key table
                                            domainValues.push(field[termColumnName]);
                                        });
                                    }, function error(response) {
                                        console.log(response);
                                    });
                                }, function error(response) {
                                    console.log(response);
                                });
                            })(key);
                        }
                    });

                    // If there are filters, populate the model with existing records' column values
                    if (context.filters) {
                        var path = new ERMrest.DataPath(table);
                        var filters = [];
                        angular.forEach(context.filters, function(value, key) {
                            var column = path.context.columns.get(key);
                            filters.push(new ERMrest.BinaryPredicate(column, ERMrest.OPERATOR.EQUAL, value));
                        });
                        // TODO: Store filters in URI form in model to use later on form submission
                        var filterString = new ERMrest.Conjunction(filters);
                        // dataEntryModel.filterUri = filterString.toUri();

                        var path = path.filter(filterString);
                        path.entity.get().then(function success(entity) {
                            angular.forEach(entity[0], function(value, colName) {
                                var pathColumnType = path.context.columns.get(colName).column.type.name;
                                if (pathColumnType == 'date' || pathColumnType == 'timestamptz') {
                                    // Must transform the value into a Date so that
                                    // Angular won't complain when putting the value
                                    // in an input of type "date" in the view
                                    value = new Date(value);
                                }
                                dataEntryModel.rows[dataEntryModel.rows.length - 1][colName] = value;
                            });
                        }, function error(response) {
                            alert('Sorry, the requested record was not found. Please check the URL and refresh the page.');
                            console.log('The requested record in schema ' + context.schemaName + ', table ' + context.tableName + ' with the following attributes: ' + context.filters + ' was not found.');
                        });
                    }
                    console.log('Model:',dataEntryModel);
                } else {
                    alert('Sorry, the requested table "' + context.tableName + '" was not found. Please check the URL and refresh the page.');
                    console.log('Table not found.');
                }
            } else {
                alert('Sorry, the requested schema "' + context.schemaName + '" was not found. Please check the URL and refresh the page');
                console.log('Schema not found.');
            }
        }, function error(response) {
            if (response.status == 401) {
                getGoauth(encodeSafeURIComponent(window.location.href));
                console.log(response);
            }
        });

        function getGoauth(referrer) {
            var url = '/ermrest/authn/preauth?referrer=' + referrer;
            $http.get(url).then(function success(response) {
                window.open(response.data.redirect_url, '_self');
            }, function error(response) {
                console.log('Error: ', error);
            });
        }

        function encodeSafeURIComponent(str) {
            return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
                return '%' + c.charCodeAt(0).toString(16).toUpperCase();
            });
        }

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
