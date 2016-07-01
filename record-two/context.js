// Holds the default context information.
(function() {
    'use strict';

    angular.module('chaise.record')

    .constant('context', {
        serviceURL: null,
        catalogID: null,
        schemaName: null,
        tableName: null,
        filters: null,
        server: null
    });
})();
