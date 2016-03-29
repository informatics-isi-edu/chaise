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
    serviceURL: 'https://localhost/ermrest',
    catalogID: '1',
    schemaName: 'legacy',
    tableName: 'dataset',
    filters: []
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
    //  "#catalog_id/[schema_name:]table_name[/{attribute::op::value}{&attribute::op::value}*]"
    hash = window.location.hash;
    if (hash === undefined || hash == '' || hash.length == 1) {
        return;
    }

    var fragment = hash.substring(1).split('/');
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
.value('recordsetModel', {header:[],rowset:[]})

// Register the recordset controller
.controller('recordsetController', ['$scope', 'recordsetModel', function($scope, recordsetModel) {
    $scope.vm = recordsetModel;
}])

// Register work to be performed after loading all modules
.run(['context', 'recordsetModel', 'ermrestServerFactory', function(context, recordsetModel, ermrestServerFactory) {
    // Get rowset data from ermrest
    var server = ermrestServerFactory.getServer(context.serviceURL);
    var catalog = server.catalogs.get(context.catalogID).then(function(catalog) {
        console.log(catalog);

        // get table definition
        var table = catalog.schemas.get(context.schemaName).tables.get(context.tableName);
        console.log(table);
        recordsetModel.table = table;
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

        // get rowset from table
        table.entity.get(filter).then(function (rowset) {
          console.log(rowset);
          recordsetModel.rowset = rowset;
        }, function(error) {
          console.log(error);
        });
    });
}])

/* end recordset */;
