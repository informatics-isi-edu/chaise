(function() {
    'use strict';

    angular.module('chaise.dataEntry')

    .controller('FormController', ['data', function FormController(data) {
        var vm = this;
        vm.data = data;
        vm.newData = {};
        vm.showForm = true;
        vm.cancel = cancel;
        vm.confirmSubmission = confirmSubmission;
        vm.submit = submit;

        function cancel() {
            vm.showForm = true;
        }

        function confirmSubmission() {
            vm.showForm = false;
        }

        function submit() {
            // Put the new data in an array so that it's compatible with ERMrest
            vm.newData = [vm.newData];

            // How to programmatically tell which columns are defaults?
            vm.data.table.entity.post(vm.newData, ['id', 'created']).then(function success(entity) {
                console.log(entity);
            }, function error(response) {
                console.log(response);
            });

            vm.newData = {};
            vm.showForm = true;
        }
    }]);
})();
