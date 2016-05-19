(function() {
    'use strict';

    angular.module('chaise.errors', ['ui.bootstrap'])

    // Factory for each error type
    .factory('ErrorService', ['$injector', function ErrorService($injector) {

        function error409(error) {
            // retry logic
            // passthrough to app for now
        }

        return {
            error409: error409
        };
    }]);
})();
