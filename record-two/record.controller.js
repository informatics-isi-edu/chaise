(function() {
    'use strict';

    angular.module('chaise.record')

    .controller('RecordController', ['$window', function RecordController($window) {
        var vm = this;
        
        vm.editRecord = function editRecord() {
            $window.location.href = '../recordedit/' + $window.location.hash;
        }
    }]);
})();
