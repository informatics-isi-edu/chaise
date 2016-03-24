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
angular.module('recordsetApp', ['ERMrest'])

// Register the 'context' object which can be accessed by config and other
// services.
.constant('context', {
    serviceURL: 'https://localhost/ermrest',
    catalogID: '1',
    schemaName: 'legacy',
    tableName: 'dataset'
})

// Register work to be performed on module loading.
.config(['context', function(context) {
    // This config example shows how one might parse the window
    // location hash and configure the context for the search.
    //
    // Note that we do not like using angular's '$location' service because
    // it encodes and/or decodes the URL in ways that are incompatible with
    // our applications. We need control of the encoding of the URLs.

    // First, configure the service URL, assuming its this origin plus the
    // typical deployment location for ermrest.
    context.serviceURL = window.location.origin + "/ermrest";

    // Then, parse the URL fragment id (aka, hash)
    // Expected format: "#catalog_id/[schema_name:]table_name"
    hash = window.location.hash;
    if (hash === undefined || hash == '' || hash.length == 1) {
        return;
    }

    var parts = hash.substring(1).split('/');
    context.catalogID = parts[0];
    if (parts[1]) {
        parts = parts[1].split(':');
        if (parts.length > 1) {
            context.schemaName = parts[0];
            context.tableName = parts[1];
        }
        else {
            context.schemaName = '';
            context.tableName = parts[0];
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

        // get rows TODO: add filters
        table.entity.get().then(function (rowset) {
          console.log(rowset);
          recordsetModel.rowset = rowset;
        }, function(error) {
          console.log(error);
        });
    });
}])

/* end recordsetApp */;
