(function() {
    // Capitalize: A filter that capitalizes the first character for each word in a string
    'use strict';

    angular.module('chaise.dataEntry')

    .filter('toTitleCase', function() {
        return function toTitleCase(input) {
            return input.replace(/[^-'\s]+/g, function(word) {
                return word.replace(/^./, function(first) {
                    return first.toUpperCase();
                });
            });
        }
    });
})();
