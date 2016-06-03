(function() {
    'use strict';

    angular.module('chaise.errors', ['chaise.utils'])

    // Factory for each error type
    .factory('ErrorService', ['$log', 'UriUtils', function ErrorService($log, UriUtils) {

        function error401(error) {
            UriUtils.getGoauth(UriUtils.fixedEncodeURIComponent(window.location.href));
        }

        function error409(error) {
            // retry logic
            // passthrough to app for now
        }

        // Special behavior for handling annotations not found because an
        // annotation that wasn't found != a true 404 error. Just means an
        // ERMrest resource doesn't have a particular annotation.
        function annotationNotFound(error) {
            $log.info(error);
        }

        // This may change, but figured each app would handle this similarly
        function tableNotFound(error) {
            $log.info(error);
        }

        // This may change, but figured each app would handle this similarly
        function schemaNotFound(error) {
            $log.info(error);
        }

        return {
            error401: error401,
            error409: error409,
            annotationNotFound: annotationNotFound,
            tableNotFound: tableNotFound,
            schemaNotFound: schemaNotFound
        };
    }]);
})();
