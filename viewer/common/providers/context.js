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
        groups: {
            users: 'g:ff766864-a03f-11e5-b097-22000aef184d',
            annotators: 'g:6156c52c-cba3-11e5-aa44-22000ab4b42b',
            curators: 'g:b43617fc-cba3-11e5-9641-22000ab80e73'
        }
    });
})();
