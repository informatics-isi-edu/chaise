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
            if (newAnnotation.anatomy == 'No Anatomy') {
                newAnnotation.anatomy = null;
            }
            // WHEN REMOVING this ~jessie, set newAnnotation.context_uri to iframe.location.href 3 lines down
            newAnnotation.context_uri = iframe.location.href.replace(/\/~jessie/g, '');
            newAnnotation = [{
                "image_id": context.imageID,
                "anatomy": newAnnotation.anatomy,
                "context_uri": newAnnotation.context_uri,
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
            if (annotation.data.anatomy == 'No Anatomy') {
                annotation.data.anatomy = null;
            }

            // Update in ERMrest
            annotation.data.context_uri = annotation.data.context_uri.replace(/\/~jessie/g, '');
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

        function highlightAnnotation(annotation) {
            iframe.postMessage({messageType: 'highlightAnnotation', content: annotation.data}, origin);
        };

        return {
            drawAnnotation: drawAnnotation,
            createAnnotation: createAnnotation,
            cancelNewAnnotation: cancelNewAnnotation,
            updateAnnotation: updateAnnotation,
            deleteAnnotation: deleteAnnotation,
            highlightAnnotation: highlightAnnotation
        };

    }]);
})();
