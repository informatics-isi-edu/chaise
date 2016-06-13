(function() {
    'use strict';

    angular.module('chaise.utils', [])

    .factory('UriUtils', ['$injector', '$window', function($injector, $window) {

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
            }
        }
    }]);
})();
