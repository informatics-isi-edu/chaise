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
angular.module('recordset', ['ERMrest'])

// Register the 'context' object which can be accessed by config and other
// services.
.constant('context', {
    serviceURL: '', // 'https://www.example.org/ermrest'
    catalogID: '',  // '1'
    schemaName: '', // 'isa'
    tableName: '',  // 'assay'
    filters: [],
    sort: null,        // 'column::desc::' ::desc:: is option, ,only allow 1 column
    pageLimit: 10
})

// Register configuration work to be performed on module loading.
.config(['context', function(context) {
    // Note that we do not like using angular's '$location' service because
    // it encodes and/or decodes the URL in ways that are incompatible with
    // our applications. We need control of the encoding of the URLs.

    // First, configure the service URL, assuming its this origin plus the
    // typical deployment location for ermrest.
    context.serviceURL = window.location.origin + "/ermrest";

    // Then, parse the URL fragment id (aka, hash). Expected format:
    //  "#catalog_id/[schema_name:]table_name[/{attribute::op::value}{&attribute::op::value}*][@sort(column[::desc::])]"
    var hash = window.location.hash;
    if (hash === undefined || hash == '' || hash.length == 1) {
        return;
    }

    // parse out @sort(...)
    if (hash.indexOf("@sort(") !== -1) {
        context.sort = hash.match(/@sort\((.*)\)/)[1];
    }

    // content before @sort
    var parts = hash.split("@sort(")[0];
    var fragment = parts.substring(1).split('/');
    var len = fragment.length;
    context.catalogID = fragment[0];
    if (len > 1) {

        // Parse the schema:table name
        schemaTable = fragment[1].split(':');
        if (schemaTable.length > 1) {
            context.schemaName = schemaTable[0];
            context.tableName = schemaTable[1];
        }
        else {
            context.schemaName = '';
            context.tableName = schemaTable[0];
        }

        // Parse the filters
        if (len>2) {
            // The '/' is also a valid separator for conjunctions but for
            // simplicity we just support '&' at this point. Something for
            // future discussion.
            var conjunction = fragment[2].split('&');
            for (var i in conjunction) {
                var filter = conjunction[i].split("::");
                if (filter.length != 3) {
                    // Currently, this only supports binary predicates, skips others
                    console.log("invalid filter string: " + filter);
                    continue;
                }

                // Push filters as simple (name, op, value) triples
                if (filter[1] === "eq") {
                    context.filters.push({name:filter[0],op:"=",value:filter[2]});
                } else {
                    context.filters.push({name:filter[0],op:"::"+filter[1]+"::",value:filter[2]});
                }
            }
            console.log(context.filters);
        }
    }
}])

// Register the 'recordsetModel' object, which can be accessed by other
// services, but cannot be access by providers (and config, apparently).
.value('recordsetModel', {
    header:[],
    columns: [],
    filter: null,
    sortby: null,     // column name, user selected or null
    sortOrder: null,  // asc (default) or desc
    rowset:[],
    key: [] ,
    count: 0,         // total number of rows
    page: 0,          // current page
    pageCount : 0 }
)


// Register the recordset controller
.controller('recordsetController', ['$scope', '$rootScope', '$window', 'recordsetModel', 'context', function($scope, $rootScope, $window, recordsetModel, context) {

    $scope.vm = recordsetModel;
    
    $scope.page = 1;

    /**
     *
     */
    $scope.sort = function () {

        // update the address bar
        // page does not reload, but save location
        window.location.href = $scope.permalink();
        $rootScope.location = window.location.href;

        $rootScope.previousButtonDisabled = true;
        $rootScope.nextButtonDisabled = true;

        var sort = [];
        if (recordsetModel.sortby !== null) {
            sort.push({"column": recordsetModel.sortby, "order": recordsetModel.sortOrder});
        }

        for (var i = 0; i < recordsetModel.key.length; i++) { // all the key columns
            var col = recordsetModel.key[i].name;
            if (col !== recordsetModel.sortby) {
                sort.push({"column": col, "order": "asc"});
            }
        }

        $rootScope.loading = true;

        recordsetModel.table.entity.get(recordsetModel.filter, context.pageLimit, null, sort).then(function (rowset) {
            $rootScope.loading = false;
            console.log(rowset);
            $scope.page = 1;
            recordsetModel.rowset = rowset;

            // enable buttons
            $rootScope.previousButtonDisabled = true; // on page 1
            $rootScope.nextButtonDisabled = ((recordsetModel.rowset !== null) && ($scope.page === recordsetModel.pageCount));
        }, function (response) {
            console.log("Error getting entities: ");
            console.log(response);

            $rootScope.loading = false;

            // enable buttons
            $rootScope.previousButtonDisabled = ($scope.page === 1);
            $rootScope.nextButtonDisabled = ($scope.page === recordsetModel.pageCount);
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
        var url = window.location.href.replace(window.location.hash, ''); // everything before #
        url = url + "#" + context.catalogID + "/" +
            (context.schemaName !== '' ? context.schemaName + ":" : "") +
            context.tableName;

        if (recordsetModel.filter !== null) {
            url = url + "/" + recordsetModel.filter.toUri();
        }

        if (recordsetModel.sortby !== null) {
            url = url + "@sort(" + recordsetModel.sortby;
            if (recordsetModel.sortOrder === "desc") {
                url = url + "::desc::";
            }
            url = url + ")";
        }
        return url;
    };

    $scope.before = function() {

        if ($scope.page > 1) {

            $rootScope.loading = true;

            // disable buttons while loading
            $rootScope.previousButtonDisabled = true;
            $rootScope.nextButtonDisabled = true;

            recordsetModel.rowset.before().then(function (rowset) {
                console.log(rowset);
                $window.scrollTo(0, 0);
                recordsetModel.rowset = rowset;
                $scope.page -= 1;

                $rootScope.loading = false;

                // enable buttons
                $rootScope.previousButtonDisabled = ($scope.page === 1);
                $rootScope.nextButtonDisabled = ($scope.page === recordsetModel.pageCount);

            }, function (response) {
                console.log(response);

                $rootScope.loading = false;

                // enable buttons
                $rootScope.previousButtonDisabled = ($scope.page === 1);
                $rootScope.nextButtonDisabled = ($scope.page === recordsetModel.pageCount);
            });
        }
    };

    $scope.after = function() {

        if ($scope.page < recordsetModel.pageCount) {

            $rootScope.loading = true;

            // disable buttons while loading
            $rootScope.previousButtonDisabled = true;
            $rootScope.nextButtonDisabled = true;

            recordsetModel.rowset.after().then(function(rowset) {
                console.log(rowset);

                $window.scrollTo(0, 0);
                $scope.page += 1;
                recordsetModel.rowset = rowset;

                $rootScope.loading = false;

                // enable buttons
                $rootScope.previousButtonDisabled = ($scope.page === 1);
                $rootScope.nextButtonDisabled = ($scope.page === recordsetModel.pageCount);

            }, function(response) {
                console.log(response);

                $rootScope.loading = false;

                //enable buttons
                $rootScope.previousButtonDisabled = ($scope.page === 1);
                $rootScope.nextButtonDisabled = ($scope.page === recordsetModel.pageCount);
            });
        }

    };

}])

// Register work to be performed after loading all modules
.run(['$rootScope', 'context', 'recordsetModel', 'ermrestServerFactory', function($rootScope, context, recordsetModel, ermrestServerFactory) {

    $rootScope.location = window.location.hash;
    $rootScope.loading = true;

    // Get rowset data from ermrest
    var server = ermrestServerFactory.getServer(context.serviceURL);
    server.catalogs.get(context.catalogID).then(function(catalog) {
        console.log(catalog);

        // get table definition
        var table = catalog.schemas.get(context.schemaName).tables.get(context.tableName);
        console.log(table);
        recordsetModel.table = table;
        recordsetModel.columns = table.columns.names();
        recordsetModel.header = table.columns.names();
        console.log(recordsetModel.header);

        // build up filters
        var filter = null;
        var len = context.filters.length;
        if (len == 1) {
          filter = new ERMrest.BinaryPredicate(
            table.columns.get(context.filters[0].name),
            context.filters[0].op,
            context.filters[0].value);
        }
        else if (len > 1) {
          var filters = [];
          for (var i=0; i<len; i++) {
            filters.push(
              new ERMrest.BinaryPredicate(
                table.columns.get(context.filters[i].name),
                context.filters[i].op,
                context.filters[i].value)
            );
          }
          filter = new ERMrest.Conjunction(filters);
        }
        recordsetModel.filter = filter;

        // Key, used for paging
        recordsetModel.key = table.keys.all()[0].colset.columns;

        // sorting
        var sort = [];

        // user selected column as the priority in sort
        // followed by all the key columns
        if (context.sort !== null) {
            if (context.sort.endsWith("::desc::")) {
                recordsetModel.sortby = context.sort.match(/(.*)::desc::/)[1];
                recordsetModel.sortOrder = 'desc';
            } else {
                recordsetModel.sortby = context.sort;
                recordsetModel.sortOrder = 'asc';
            }

            sort.push({"column": recordsetModel.sortby, "order": recordsetModel.sortOrder});
        }

        for (i = 0; i < recordsetModel.key.length; i++) { // all the key columns
            var col = recordsetModel.key[i].name;
            if (col !== recordsetModel.sortby) {
                sort.push({"column": col, "order": "asc"});
            }
        }

        // first get row count
        table.entity.count(filter).then(function(count) {
            recordsetModel.count = count;
            recordsetModel.pageCount = Math.ceil(count / context.pageLimit);
            console.log(count + " records. " + recordsetModel.pageCount + " pages");

            // get rowset from table
            table.entity.get(filter, context.pageLimit, null, sort).then(function (rowset) {
                console.log(rowset);
                recordsetModel.rowset = rowset;

                $rootScope.loading = false;
                $rootScope.previousButtonDisabled = true;
                $rootScope.nextButtonDisabled = (recordsetModel.pageCount === 1);

            }, function(error) {
                console.log(error);
                $rootScope.loading = false;
                $rootScope.previousButtonDisabled = true;
                $rootScope.nextButtonDisabled = true;
            });
        }, function(response) {
            $rootScope.loading = false;
            $rootScope.previousButtonDisabled = true;
            $rootScope.nextButtonDisabled = true;
            return module._q.reject(response.data);
        });

    });


    window.onhashchange = function() {
        // when address bar changes due to back or forward button
        // reload page
        if (window.location.href !== $rootScope.location) {
            location.reload();
        }
    }
}])

/* end recordset */;
