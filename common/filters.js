(function() {
    'use strict';

    angular.module('chaise.filters', [])

    // Underscore to Space: A filter that replaces underscores with spaces
    .filter('underscoreToSpace', function() {
        return function underscoreToSpace(input) {
            if (typeof input === "string") {
                return input.replace(/_/g, ' ');
            }
            return input;
        }
    })

    // toTitleCase: A filter that capitalizes the first character for each word in a string
    .filter('toTitleCase', function() {
        return function toTitleCase(input) {
            if (typeof input === "string") {
                return input.replace(/[^-'\s]+/g, function(word) {
                    return word.replace(/^./, function(first) {
                        return first.toUpperCase();
                    });
                });
            }
            return input;
        }
    });
})();
