(function() {
    angular.module('chaise.viewer')

    .controller('AnnotationsController', ['annotations', 'anatomies', function AnnotationsController(annotations, anatomies) {
        // vm = short for ViewModel
        var vm = this;
        vm.annotations = annotations;
        vm.anatomies = anatomies;
    }]);
})();
