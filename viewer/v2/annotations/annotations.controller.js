(function() {
    'use strict';

    angular.module('chaise.viewer')

    .controller('AnnotationsController', ['annotations', 'anatomies', 'AnnotationsService', function AnnotationsController(annotations, anatomies, AnnotationsService) {
        var vm = this;
        vm.annotations = annotations;
        vm.anatomies = anatomies;




        vm.deleteAnnotation = function deleteAnnotation(annotation) {
            return AnnotationsService.deleteAnnotation(annotation);
        };

    }]);
})();
