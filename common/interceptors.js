(function() {
    'use strict';

    angular.module('chaise.interceptors', ['chaise.errors'])

    .factory('Interceptors', ['$q', '$log', 'ErrorService', function Interceptors($q, $log, ErrorService) {

        var responseInterceptor = {
            response: function(response) {
                return response;
            },
            responseError: function(error) {
                $log.info(error);
                switch (error.status) {
                    case 401:
                        ErrorService.error401(error);
                        break;
                    case 409:
                        ErrorService.error409(error);
                        break;
                    default:
                    // warn or error?
                        $log.warn(error);
                }
                return $q.reject(error);
            }
        };

        return responseInterceptor;
    }]);
})();
