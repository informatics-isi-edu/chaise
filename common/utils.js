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
            },

            parseURLFragment: function (context) {
                console.log(context);
                // var hash = window.location.hash;
                //
                // if (hash === undefined || hash == '' || hash.length == 1) {
                //     return;
                // }
                //
                // var parts = hash.substring(1).split('/');
                // context.catalogID = parts[0];
                // if (parts[1]) {
                //     var params = parts[1].split(':');
                //     if (params.length > 1) {
                //         context.schemaName = decodeURIComponent(params[0]);
                //         context.tableName = decodeURIComponent(params[1]);
                //     } else {
                //         context.tableName = decodeURIComponent(params[0]);
                //     }
                // }
                //
                // // If there are filters appended to the URL, add them to context.js
                // if (parts[2]) {
                //     context.filters = {};
                //     var filters = parts[2].split('&');
                //     for (var i = 0, len = filters.length; i < len; i++) {
                //         var filter = filters[i].split('=');
                //         if (filter[0] && filter[1]) {
                //             context.filters[decodeURIComponent(filter[0])] = decodeURIComponent(filter[1]);
                //         }
                //     }
                // }

                return context;
            },

            getOrigin: function () {

            }
        }
    }]);
})();
