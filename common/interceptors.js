(function() {
    'use strict';

    angular.module('chaise.interceptors', [])

    .factory('Interceptors', ['$q', 'ErrorService', function Interceptors($q, ErrorService) {

        var responseInterceptor = {
            response: function(response) {
                console.log("Success", response);
                return response;
            },
            responseError: function(error) {
                console.log("Error", error);
                return error;
            }
        };

        return responseInterceptor;
    }]);
})();
