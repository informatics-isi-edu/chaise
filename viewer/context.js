// Holds the default context information.
(function() {
    'use strict';

    angular.module('chaise.viewer')

    // TODO could be attached directly to $rootScope
    .value('context', {
        catalogID: null, // the catalog id
        imageID: null, // the RID of main image
        defaultZIndex: null, // the default z-index
    });
})();
