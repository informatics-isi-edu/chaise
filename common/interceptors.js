(function() {
    'use strict';

    angular.module('chaise.interceptors', [])

    .factory('Interceptors', ['$q', 'ErrorService', function Interceptors($q, ErrorService) {

        var responseInterceptor = {
            response: function(response) {
                return response;
            },
            responseError: function(error) {
                switch (error.status) {
                    case 409:
                        ErrorService.error409(error);
                }
                console.log("Error", error);
                return $q.reject(error);
            }
        };

        return responseInterceptor;
    }]);
})();
