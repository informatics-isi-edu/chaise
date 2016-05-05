(function() {
    'use strict';

    angular.module('chaise.filters', [])

    // Underscore to Space: Replaces underscores with spaces
    .filter('underscoreToSpace', function() {
        return function underscoreToSpace(input) {
            if (typeof input === "string") {
                return input.replace(/_/g, ' ');
            }
            return input;
        }
    })

    // toTitleCase: Capitalizes the first character for each word in a string
    // TODO: Make it more ~ROBUST~ internationalize this
    // Account for names with slashes, hyphens, Cyrillic names, Klingon, Chinese, etc.
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
