(function() {
    'use strict';

    angular.module('chaise.utils', [])

    .factory('UriUtils', ['$injector', function($injector) {

        return {

            /**
             * @function
             * @param {String} str string to be encoded.
             * @desc
             * converts a string to an URI encoded string
             */
            fixedEncodeURIComponent: function (str) {
                return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
                    return '%' + c.charCodeAt(0).toString(16).toUpperCase();
                })
            },

            getGoauth: function (referrer) {
                var url = '/ermrest/authn/preauth?referrer=' + referrer;
                // injecting $http with $injector
                // trying to define it as a controller depency causes a circular depency
                // UriUtils <- ErrorService <- interceptors <- $http <- ermrestServletFactory
                $injector.get('$http').get(url).then(function success(response) {
                    window.open(response.data.redirect_url, '_self');
                }, function error(response) {
                    console.log('Error: ', error);
                });
            }
        }
    }]);
})();
