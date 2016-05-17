// Holds the default context information.
(function() {
    'use strict';

    angular.module('chaise.dataEntry')

    .constant('context', {
        serviceURL: null,
        catalogID: null,
        schemaName: null,
        tableName: null,
        maxRowsToAdd: 25,
        booleanValues: ['', true, false]
    });
})();
