(function() {
    'use strict';

    angular.module('chaise.config', [])

    // initialize the dcctx (deriva-client-context object) with the global chaise config or an empty one if it's not present
    .config(['$windowProvider', function ($windowProvider) {
        var $window = $windowProvider.$get();
        // when initializing the application, always replace the dcctx on the window object (it persists within the same window (tab mroe specifically))
        $window.dcctx = {
            chaiseConfig: chaiseConfig || {}
        }
    }])

})();
