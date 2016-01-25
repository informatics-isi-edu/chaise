(function() {
    // Capitalize: A filter that capitalizes the first character for each word in a string
    'use strict';

    angular.module('chaise.viewer')

    .filter('capitalize', function() {
        return function(input, all) {
            var regex = (all) ? /([^\W_]+[^\s-]*) */g : /([^\W_]+[^\s-]*)/;
            return (!!input) ? input.replace(regex, function(txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            }) : '';
        }
    });
})();
