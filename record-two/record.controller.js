(function() {
    'use strict';

    angular.module('chaise.record')

    .controller('RecordController', ['$window', function RecordController($window) {
        var vm = this;

        vm.editRecord = chaiseConfig.editRecord;

        vm.createRecord = function() {
            var hash = $window.location.hash;
            // Should I substring based on the position of id or should I split on '/' and piece back together parts 0,1?
            $window.location.href = "../recordedit/" + hash.substring(0, hash.indexOf('id')-1);
        }

        vm.editRecord = function() {
            $window.location.href = "../recordedit/" + $window.location.hash;
        }
    }]);
})();
