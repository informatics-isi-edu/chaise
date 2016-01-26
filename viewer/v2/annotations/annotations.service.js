(function() {
    'use strict';

    angular.module('chaise.viewer')

    .factory('AnnotationsService', ['context', 'annotations', '$window', function(context, annotations, $window) {
        var origin = window.location.origin;
        var iframe = $window.frames[0];

        function drawAnnotation() {
            iframe.postMessage({messageType: 'drawAnnotation'}, origin);
        }

        function createAnnotation(newAnnotation) {
            if (!newAnnotation.anatomy) {
                newAnnotation.anatomy = null;
            }

            newAnnotation = [{
                "image_id": context.imageID,
                "anatomy": newAnnotation.anatomy,
                "context_uri": iframe.location.href,
                "coords": [
                    newAnnotation.shape.geometry.x,
                    newAnnotation.shape.geometry.y,
                    newAnnotation.shape.geometry.width,
                    newAnnotation.shape.geometry.height
                ],
                "description": newAnnotation.description
            }];

            // Add to ERMrest
            return annotations[0].table.createEntity(newAnnotation, ['id', 'author', 'created']).then(function success(annotation) {
                // Then add to Annotorious
                iframe.postMessage({messageType: 'createAnnotation', content: annotation.data}, window.location.origin);
                // Push new annotation to value provider
                annotations.push(annotation);
            });
        }

        function cancelNewAnnotation() {
            iframe.postMessage({messageType: 'cancelAnnotationCreation'}, origin);
        }

        function updateAnnotation(annotation) {
            if (!annotation.anatomy) {
                annotation.anatomy = null;
            }

            // Update in ERMrest
            annotation.update();
            // Update in Annotorious
            iframe.postMessage({messageType: 'updateAnnotation', content: annotation.data}, origin);
        }

        function deleteAnnotation(annotation) {
            // Delete from ERMrest
            annotation.delete();
            // Delete from 'annotations' provider
            var index = annotations.indexOf(annotation);
            annotations.splice(index, 1);
            // Delete in Annotorious
            iframe.postMessage({messageType: 'deleteAnnotation', content: annotation.data}, origin);
        }

        return {
            drawAnnotation: drawAnnotation,
            createAnnotation: createAnnotation,
            cancelNewAnnotation: cancelNewAnnotation,
            updateAnnotation: updateAnnotation,
            deleteAnnotation: deleteAnnotation
        };

    }]);
})();
