(function() {
    'use strict';

    angular.module('chaise.errors', [])

    // Factory for each error type
    .factory('ErrorService', [function ErrorService() {

        function error409(error) {
            // retry logic
            // passthrough to app for now
        }

        // Special behavior for handling annotations not found because an
        // annotation that wasn't found != a true 404 error. Just means an
        // ERMrest resource doesn't have a particular annotation.
        function annotationNotFound(error) {
            console.log(error);
        }

        return {
            error409: error409,
            annotationNotFound: annotationNotFound
        };
    }]);
})();
