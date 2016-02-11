// Holds the default context information.
(function() {
    'use strict';

    angular.module('chaise.viewer')

    .constant('context', {
        serviceURL: 'https://localhost/ermrest',
        catalogID: '1',
        schemaName: 'rbk',
        tableName: 'image',
        imageID: '1',
        session: {}
    });
})();
