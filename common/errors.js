(function() {
    'use strict';

    angular.module('chaise.errors', [])

    // Factory for each error type
    .factory('ErrorService', [function ErrorService() {

        function error409(error) {
            // retry logic
            // passthrough to app for now
        }

        return {
            error409: error409
        };
    }]);
})();
