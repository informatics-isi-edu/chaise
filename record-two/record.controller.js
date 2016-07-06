(function() {
    'use strict';

    angular.module('chaise.record')

    .controller('RecordController', ['recordModel', function FormController(recordModel) {
        var vm = this;
        vm.record = recordModel.record;
    }]);
})();
