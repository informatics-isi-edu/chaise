(function() {
    'use strict';

    angular.module('chaise.views', [])
    .directive('navbar', function() {
        return {
            templateUrl: '../common/templates/navbar.html'
        };
    });
})();