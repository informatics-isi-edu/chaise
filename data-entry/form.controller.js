(function() {
    'use strict';

    angular.module('chaise.dataEntry')

    .controller('FormController', ['data', function FormController(data) {
        var vm = this;
        vm.data = data;

    }]);
})();
