(function() {
    // Underscore to Space: A filter that replaces underscores with spaces
    'use strict';

    angular.module('chaise.dataEntry')

    .filter('underscoreToSpace', function() {
        return function underscoreToSpace(input) {
            if (typeof input === "string") {
                return input.replace(/_/g, ' ');
            }
            return input;
        }
    });
})();
