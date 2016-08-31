(function() {
    'use strict';

    angular.module('chaise.record')

    .controller('RecordController', ['$window', '$rootScope', function RecordController($window, $rootScope) {
        var vm = this;

        vm.editRecord = chaiseConfig.editRecord;

        vm.createRecord = function() {
            var parts = $rootScope.reference.location.compactPath.split('/');
            // Should I substring based on the position of id or should I split on '/' and piece back together parts 0,1?
            $window.location.href = "../recordedit/#" + $rootScope.reference.location.catalog + '/' + parts[0];
        }

        vm.editRecord = function() {
            $window.location.href = "../recordedit/#" + $rootScope.reference.location.catalog + '/' + $rootScope.reference.location.compactPath;
        }
    }]);
})();
