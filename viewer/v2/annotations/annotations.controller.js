(function() {
    'use strict';

    angular.module('chaise.viewer')

    .controller('AnnotationsController', ['annotations', 'anatomies', 'AnnotationsService', function AnnotationsController(annotations, anatomies, AnnotationsService) {
        var vm = this;
        vm.annotations = annotations;
        vm.anatomies = anatomies;

        vm.editedAnnotation = null; // Track which annotation is being edited right now; used to show/hide the right UI elements depending on which one is being edited.
        // vm.originalAnnotation = null; // Holds the original contents of annotation in the event that a user cancels an edit

        vm.editAnnotation = function editAnnotation(annotation) {
            vm.editedAnnotation = annotation.data.id;
            // vm.originalAnnotation = annotation;
        };

        vm.cancelAnnotationEdit = function cancelAnnotationEdit(annotation) {
            vm.editedAnnotation = null;
            // annotation = vm.originalAnnotation;
        };

        vm.updateAnnotation = function updateAnnotation(annotation) {
            vm.editedAnnotation = null;
            return AnnotationsService.updateAnnotation(annotation);
        }

        vm.deleteAnnotation = function deleteAnnotation(annotation) {
            return AnnotationsService.deleteAnnotation(annotation);
        };

    }]);
})();
