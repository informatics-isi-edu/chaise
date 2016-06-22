// Holds the default context information.
(function() {
    'use strict';

    angular.module('chaise.recordEdit')

    .constant('context', {
        serviceURL: null,
        catalogID: null,
        schemaName: null,
        tableName: null,
        filters: null,
        booleanValues: ['', true, false],
        server: null
    });
})();
