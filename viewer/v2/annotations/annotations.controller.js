(function() {
    'use strict';

    angular.module('chaise.viewer')

    .controller('AnnotationsController', ['annotations', 'anatomies', 'AnnotationsService', '$window', '$scope', function AnnotationsController(annotations, anatomies, AnnotationsService, $window, $scope) {
        var vm = this;
        vm.annotations = annotations;
        vm.anatomies = anatomies;

        vm.createMode = false;
        vm.drawAnnotation = drawAnnotation;
        vm.newAnnotation = null;
        vm.createAnnotation = createAnnotation;
        vm.cancelNewAnnotation = cancelNewAnnotation;

        vm.editedAnnotation = null; // Track which annotation is being edited right now; used to show/hide the right UI elements depending on which one is being edited.
        // vm.originalAnnotation = null; // Holds the original contents of annotation in the event that a user cancels an edit
        vm.editAnnotation = editAnnotation;
        vm.cancelEdit = cancelEdit;

        vm.updateAnnotation = updateAnnotation;

        vm.deleteAnnotation = deleteAnnotation;

        function drawAnnotation(annotation) {
            return AnnotationsService.drawAnnotation();
        }

        function createAnnotation() {
            vm.createMode = false;
            return AnnotationsService.createAnnotation(vm.newAnnotation);
        }

        function cancelNewAnnotation() {
            vm.createMode = false;
            return AnnotationsService.cancelNewAnnotation();
        }

        function editAnnotation(annotation) {
            vm.editedAnnotation = annotation.data.id;
            // vm.originalAnnotation = annotation;
        };

        function cancelEdit(annotation) {
            vm.editedAnnotation = null;
            // annotation = vm.originalAnnotation;
        };

        function updateAnnotation(annotation) {
            vm.editedAnnotation = null;
            return AnnotationsService.updateAnnotation(annotation);
        }

        function deleteAnnotation(annotation) {
            return AnnotationsService.deleteAnnotation(annotation);
        };



        $window.addEventListener('message', function annotationServiceListener(event) {
            if (event.origin === window.location.origin) {
                var data = event.data;
                if (data.messageType === 'annotationDrawn') {
                    console.log(data);
                    vm.newAnnotation = {
                        description: '',
                        shape: data.content.shape
                    };
                    $scope.$apply(function() {
                        vm.createMode = true;
                    });
                    // TODO: Implement this
                    // vm.focusForm();
                }
            }
        });


    }]);
})();
