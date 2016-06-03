(function() {
    'use strict';

    angular.module('chaise.interceptors', ['chaise.errors'])

    .factory('Interceptors', ['$q', 'ErrorService', function Interceptors($q, ErrorService) {

        var responseInterceptor = {
            response: function(response) {
                return response;
            },
            responseError: function(error) {
                switch (error.status) {
                    case 401:
                        ErrorService.error401(error);
                    case 409:
                        ErrorService.error409(error);
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
