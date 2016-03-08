// Holds the default context information.
(function() {
    'use strict';

    angular.module('chaise.dataEntry')

    .constant('context', {
        serviceURL: 'https://localhost/ermrest',
        catalogID: '1',
        schemaName: 'rbk',
        tableName: 'image'
    });
})();
