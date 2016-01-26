(function() {
    'use strict';

    angular.module('chaise.viewer')

    .factory('AnnotationsService', ['annotations', '$window', function(annotations, $window) {
        var origin = window.location.origin;

        function updateAnnotation(annotation) {
            // Update in ERMrest
            annotation.update();
            // Update in Annotorious
            $window.frames[0].postMessage({messageType: 'updateAnnotation', content: annotation.data}, origin);
        }

        function deleteAnnotation(annotation) {
            // Delete from ERMrest
            annotation.delete();
            // Delete from 'annotations' provider
            var index = annotations.indexOf(annotation);
            annotations.splice(index, 1);
            // Delete in Annotorious
            $window.frames[0].postMessage({messageType: 'deleteAnnotation', content: annotation.data}, origin);
        }

        return {
            updateAnnotation: updateAnnotation,
            deleteAnnotation: deleteAnnotation
        };
    }]);
})();
