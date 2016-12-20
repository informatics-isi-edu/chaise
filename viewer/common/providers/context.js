// Holds the default context information.
(function() {
    'use strict';

    angular.module('chaise.viewer')

    .constant('context', {
        appName: 'viewer',
        serviceURL: null,
        catalogID: null,
        schemaName: null,
        tableName: null,
        imageID: null,
        queryParams: null,
        groups: {
            users: 'https://auth.globus.org/ff766864-a03f-11e5-b097-22000aef184d',
            annotators: 'https://auth.globus.org/6156c52c-cba3-11e5-aa44-22000ab4b42b',
            curators: 'https://auth.globus.org/b43617fc-cba3-11e5-9641-22000ab80e73'
        }
    });
})();
