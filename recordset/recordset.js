/*
 * Copyright 2016 University of Southern California
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// The Chaise RecordSet module
angular.module('recordset', ['ERMrest', 'chaise.navbar', 'chaise.utils', 'chaise.authen'])

// Register the 'context' object which can be accessed by config and other
// services.
.constant('context', {
    chaiseURL: '',  // 'https://www.example.org/chaise
    serviceURL: '', // 'https://www.example.org/ermrest'
    catalogID: '',  // '1'
    schemaName: '', // 'isa'
    tableName: '',  // 'assay'
    filter: {},     //
    sort: null,     // 'column::desc::' ::desc:: is option, ,only allow 1 column
    server: null
})

// Register the 'recordsetModel' object, which can be accessed by other
// services, but cannot be access by providers (and config, apparently).
.value('recordsetModel', {
    tableName: null,  // table name
    tableDisplayName: null,
    columns: [],      // [{name, displayname, hidden}, ...]
    filter: null,
    sortby: null,     // column name, user selected or null
    sortOrder: null,  // asc (default) or desc
    rowset:null,      // rows of data
    keycols: [],      // primary key set as an array of Column objects
    count: 0          // total number of rows

})

.factory('pageInfo', ['context', function(context) {
    return {
        loading: true,
        previousButtonDisabled: true,
        nextButtonDisabled: false,
        pageLimit: 10,
        recordStart: 1,
        recordEnd: this.pageLimit
    };

}])

// Register the recordset controller
.controller('recordsetController', ['$scope', '$rootScope', 'ermrestServerFactory', 'pageInfo', '$window', 'recordsetModel', 'context', 'UriUtils', 'Session', function($scope, $rootScope, ermrestServerFactory, pageInfo, $window, recordsetModel, context, UriUtils, Session) {

    $scope.vm = recordsetModel;

    $scope.server = context.server;

    $scope.pageInfo = pageInfo;

    pageInfo.recordStart = 1;

    pageInfo.recordEnd = pageInfo.pageLimit;

    $scope.pageLimit = function(limit) {
        pageInfo.pageLimit = limit;
        $scope.sort();
    };

    $scope.navbarBrand = (chaiseConfig['navbarBrand'] !== undefined? chaiseConfig.navbarBrand : "");
    $scope.navbarBrandImage = (chaiseConfig['navbarBrandImage'] !== undefined? chaiseConfig.navbarBrandImage : "");
    $scope.navbarBrandText = (chaiseConfig['navbarBrandText'] !== undefined? chaiseConfig.navbarBrandText : "Chaise");

    // login logout should be factored out into a common module
    $scope.login = function() {
        Session.login($window.location.href);
    };

    $scope.logout = function() {
        Session.logout();
    };

    $scope.sort = function () {

        // update the address bar
        // page does not reload
        location.replace($scope.permalink());
        $rootScope.location = $window.location.href;

        pageInfo.previousButtonDisabled = true;
        pageInfo.nextButtonDisabled = true;

        var sort = [];
        if (recordsetModel.sortby !== null) {
            sort.push({"column": recordsetModel.sortby, "order": recordsetModel.sortOrder});
        }

        for (var i = 0; i < recordsetModel.keycols.length; i++) { // all the key columns
            var col = recordsetModel.keycols[i].name;
            if (col !== recordsetModel.sortby) {
                sort.push({"column": col, "order": "asc"});
            }
        }

        pageInfo.loading = true;

        recordsetModel.table.entity.get(recordsetModel.filter, pageInfo.pageLimit, null, sort).then(function (rowset) {
            pageInfo.loading = false;
            console.log(rowset);
            recordsetModel.rowset = rowset;

            // enable buttons
            pageInfo.recordStart = 1;
            pageInfo.recordEnd = pageInfo.recordStart + rowset.length() - 1;
            pageInfo.previousButtonDisabled = true; // on page 1
            pageInfo.nextButtonDisabled = (recordsetModel.count <= pageInfo.recordEnd);
        }, function (error) {
            console.log("Error getting entities: ");
            console.log(error);

            pageInfo.loading = false;

            if (error instanceof ERMrest.UnauthorizedError) {
                // session has expired, login
                Session.login($window.location.href);
            } else {

                // TODO alert error

                // enable buttons
                pageInfo.previousButtonDisabled = (pageInfo.recordStart === 1); // on page 1
                pageInfo.nextButtonDisabled = (recordsetModel.count <= pageInfo.recordEnd);
            }


        })
    };

    $scope.sortby = function(column) {
        if (recordsetModel.sortby !== column) {
            recordsetModel.sortby = column;
            recordsetModel.sortOrder = "asc";
            $scope.sort();
        }

    };

    $scope.toggleSortOrder = function () {
        recordsetModel.sortOrder = (recordsetModel.sortOrder === 'asc' ? recordsetModel.sortOrder = 'desc' : recordsetModel.sortOrder = 'asc');
        $scope.sort();
    };

    $scope.permalink = function() {
        var url = $window.location.href.replace($window.location.hash, ''); // everything before #
        url = url + "#" + UriUtils.fixedEncodeURIComponent(context.catalogID) + "/" +
            (context.schemaName !== '' ? UriUtils.fixedEncodeURIComponent(context.schemaName) + ":" : "") +
            UriUtils.fixedEncodeURIComponent(context.tableName);

        if (recordsetModel.filter !== null) {
            url = url + "/" + recordsetModel.filter.toUri();
        }

        if (recordsetModel.sortby !== null) {
            url = url + "@sort(" + UriUtils.fixedEncodeURIComponent(recordsetModel.sortby);
            if (recordsetModel.sortOrder === "desc") {
                url = url + "::desc::";
            }
            url = url + ")";
        }
        return url;
    };

    $scope.before = function() {

        if (pageInfo.recordStart > 1) { // not on page 1

            pageInfo.loading = true;

            // disable buttons while loading
            pageInfo.previousButtonDisabled = true;
            pageInfo.nextButtonDisabled = true;

            recordsetModel.rowset.before().then(function (rowset) {
                console.log(rowset);
                $window.scrollTo(0, 0);
                recordsetModel.rowset = rowset;
                pageInfo.recordStart -= pageInfo.pageLimit;
                pageInfo.recordEnd = pageInfo.recordStart + rowset.length() -1;

                pageInfo.loading = false;

                // enable buttons
                pageInfo.previousButtonDisabled = (pageInfo.recordStart === 1); // on page 1
                pageInfo.nextButtonDisabled = (recordsetModel.count <= pageInfo.recordEnd);  // on last page

            }, function (error) {
                console.log(error);

                pageInfo.loading = false;

                if (error instanceof ERMrest.UnauthorizedError) {
                    // session has expired, login
                    Session.login($window.location.href);
                } else {
                    // enable buttons
                    pageInfo.previousButtonDisabled = (pageInfo.recordStart === 1); // on page 1
                    pageInfo.nextButtonDisabled = (recordsetModel.count <= pageInfo.recordEnd);  // on last page
                }


            });
        }
    };

    $scope.after = function() {

        if (pageInfo.recordEnd < recordsetModel.count) { // more records

            pageInfo.loading = true;

            // disable buttons while loading
            pageInfo.previousButtonDisabled = true;
            pageInfo.nextButtonDisabled = true;

            recordsetModel.rowset.after().then(function(rowset) {
                console.log(rowset);

                $window.scrollTo(0, 0);
                recordsetModel.rowset = rowset;
                pageInfo.recordStart += pageInfo.pageLimit;
                pageInfo.recordEnd = pageInfo.recordStart + rowset.length() - 1;

                pageInfo.loading = false;

                // enable buttons
                pageInfo.previousButtonDisabled = (pageInfo.recordStart === 1); // on page 1
                pageInfo.nextButtonDisabled = (recordsetModel.count <= pageInfo.recordEnd);  // on last page

            }, function(error) {
                console.log(error);

                pageInfo.loading = false;

                if (error instanceof ERMrest.UnauthorizedError) {
                    // session has expired, login
                    Session.login($window.location.href);
                } else {

                    //enable buttons
                    pageInfo.previousButtonDisabled = (pageInfo.recordStart === 1); // on page 1
                    pageInfo.nextButtonDisabled = (recordsetModel.count <= pageInfo.recordEnd);  // on last page
                }

            });
        }

    };

    $scope.gotoRowLink = function(index) {
        var row = recordsetModel.rowset.data[index];
        var path = context.chaiseURL + "/record/#" + UriUtils.fixedEncodeURIComponent(context.catalogID) + "/" + UriUtils.fixedEncodeURIComponent(context.schemaName) + ":" + UriUtils.fixedEncodeURIComponent(context.tableName) + "/";
        for (var k = 0; k < recordsetModel.keycols.length; k++) {
            var col = recordsetModel.keycols[k].name;
            if (k === 0) {
                path = path + UriUtils.fixedEncodeURIComponent(col) + "=" + UriUtils.fixedEncodeURIComponent(row[col]);
            } else {
                path = path + "&" + UriUtils.fixedEncodeURIComponent(col) + "=" + UriUtils.fixedEncodeURIComponent(row[col]);
            }
        }

        location.assign(path);
    }


}])

// Register work to be performed after loading all modules
.run(['$window', 'pageInfo', 'context', 'recordsetModel', 'ermrestServerFactory', '$rootScope', 'Session', 'UriUtils', function($window, pageInfo, context, recordsetModel, ermrestServerFactory, $rootScope, Session, UriUtils) {

    $rootScope.location = $window.location.href;
    pageInfo.loading = true;
    recordsetModel.tableName = context.tableName;
    $rootScope.errorMessage='';

    try {

        // parse the URL
        UriUtils.parseURLFragment($window.location, context);

        context.chaiseURL = $window.location.href.replace($window.location.hash, '');
        context.chaiseURL = context.chaiseURL.replace("/recordset/", '');

        console.log("Context", context);
    } catch (error) {
        $rootScope.errorMessage = error.message;
    }

    // Get rowset data from ermrest
    var server = context.server = ermrestServerFactory.getServer(context.serviceURL);

    server.catalogs.get(context.catalogID).then(function(catalog) {
        console.log(catalog);

        try {
            // get table definition
            var table = catalog.schemas.get(context.schemaName).tables.get(context.tableName);
            console.log(table);
            recordsetModel.table = table;
            recordsetModel.tableDisplayName = table.displayname;

            // columns
            var columns = table.columns.all();
            for (var i = 0; i < columns.length; i++) {
                var col = {name: columns[i].name, displayname: columns[i].displayname, hidden: columns[i].ignore};
                recordsetModel.columns.push(col);
            }

            recordsetModel.filter = UriUtils.parsedFilterToERMrestFilter(context.filter, table);

            // Find shortest Key, used for paging and linking
            var keys = table.keys.all().sort( function(a, b) {
                return a.colset.length() - b.colset.length();
            });
            recordsetModel.keycols = keys[0].colset.columns;

            // sorting
            var sort = [];

            // user selected column as the priority in sort
            // followed by all the key columns
            if (context.sort !== null) {
                if (context.sort.endsWith("::desc::")) {
                    recordsetModel.sortby = decodeURIComponent(
                        context.sort.match(/(.*)::desc::/)[1]
                    );
                    recordsetModel.sortOrder = 'desc';
                } else {
                    recordsetModel.sortby = decodeURIComponent(context.sort);
                    recordsetModel.sortOrder = 'asc';
                }

                // this will cause program to throw exception is sort column is not valid
                table.columns.get(recordsetModel.sortby);

                sort.push({"column": recordsetModel.sortby, "order": recordsetModel.sortOrder});
            }

            for (i = 0; i < recordsetModel.keycols.length; i++) { // all the key columns
                var col = recordsetModel.keycols[i].name;
                if (col !== recordsetModel.sortby) {
                    sort.push({"column": col, "order": "asc"});
                }
            }

            // first get row count
            table.entity.count(recordsetModel.filter).then(function (count) {
                recordsetModel.count = count;

                // get rowset from table
                table.entity.get(recordsetModel.filter, pageInfo.pageLimit, null, sort).then(function (rowset) {
                    console.log(rowset);
                    recordsetModel.rowset = rowset;

                    pageInfo.loading = false;
                    pageInfo.recordStart = 1;
                    pageInfo.recordEnd = pageInfo.recordStart + rowset.length() - 1;
                    pageInfo.previousButtonDisabled = true;
                    pageInfo.nextButtonDisabled = recordsetModel.count <= pageInfo.recordEnd;

                }, function (error) {
                    console.log(error);
                    pageInfo.loading = false;
                    pageInfo.previousButtonDisabled = true;
                    pageInfo.nextButtonDisabled = true;

                    if (error instanceof ERMrest.UnauthorizedError) {
                        // session has expired, login
                        Session.login($window.location.href);
                    }
                });
            }, function (error) {
                pageInfo.loading = false;
                pageInfo.previousButtonDisabled = true;
                pageInfo.nextButtonDisabled = true;

                if (error instanceof ERMrest.UnauthorizedError) {
                    // session has expired, login
                    Session.login($window.location.href);
                }
            });

        } catch (error) {
            pageInfo.loading = false;
            if (error instanceof ERMrest.NotFoundError ||
                error instanceof ERMrest.InvalidFilterOperatorError) {
                $rootScope.errorMessage = error.message;
            }
        }

    }, function(error) {

        // get catalog error
        console.log(error);
        pageInfo.loading = false;

        // TODO
        $rootScope.errorMessage = error.message;
        if (error instanceof ERMrest.NotFoundError) {
            // catalog not found
        } else if (error instanceof ERMrest.ForbiddenError) {

        } else if (error instanceof ERMrest.UnauthorizedError) {
            Session.login($window.location.href);
        }
    });

    $window.onhashchange = function() {
        // when address bar changes by user
        if ($window.location.href !== $rootScope.location) {
            location.reload();
        }
    };

}])

/* end recordset */;
