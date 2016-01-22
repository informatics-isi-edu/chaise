(function() {
    'use strict';

    angular.module('chaise.viewer')

    .controller('AnnotationsController', ['annotations', 'anatomies', function AnnotationsController(annotations, anatomies) {
        var vm = this;
        vm.annotations = annotations;
        vm.anatomies = anatomies;
    }]);
})();
