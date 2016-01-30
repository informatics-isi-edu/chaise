(function() {
    // Underscore to Space: A filter that replaces underscores with spaces
    'use strict';

    angular.module('chaise.viewer')

    .filter('underscoreToSpace', function() {
        return function underscoreToSpace(input) {
            return input.replace(/_/g, ' ');
        }
    });
})();
