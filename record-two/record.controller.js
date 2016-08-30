(function() {
    'use strict';

    angular.module('chaise.record')

    .controller('RecordController', ['$rootScope', '$window', function RecordController($rootScope, $window) {
        var vm = this;

        vm.permalink = function getPermalink() {
            if (!$rootScope.reference) {
                return $window.location.href;
            }
            return $rootScope.context.mainURI;
        };
    }]);
})();
