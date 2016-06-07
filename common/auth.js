(function() {
    'use strict';

    angular.module('chaise.auth', [])

    .factory('AuthService', [function AuthService() {
        // Log in was successful

        // Log in had an error

        // Log out was successful

        // Log out had an error
        
        return {
            successLogin: successLogin,
            errorLogin: errorLogin,


        };
    }]);
})();
