// Holds the default context information. Basically the Angular version of the
// chaise-config.js file.
(function() {
    'use strict';

    angular.module('chaise.viewer')

    .constant('context', {
        // Configure serviceURL from chaise-config
        serviceURL: 'https://localhost/ermrest',
        catalogID: '1',
        schemaName: 'rbk',
        tableName: 'image',
        imageID: '1'
    });
})();
