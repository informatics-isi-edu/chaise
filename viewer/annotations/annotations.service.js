(function() {
    'use strict';

    angular.module('chaise.viewer')

    .factory('AnnotationsService', ['context', 'image', 'annotations', 'sections', '$window', function(context, image, annotations, sections, $window) {
        var origin = window.location.origin;
        var iframe = document.getElementById('osd').contentWindow;

        function drawAnnotation() {
            iframe.postMessage({messageType: 'drawAnnotation'}, origin);
        }

        function createAnnotation(newAnnotation, type) {
            if (newAnnotation.anatomy == 'No Anatomy') {
                newAnnotation.anatomy = null;
            }

            newAnnotation = [{
                "image_id": context.imageID,
                "anatomy": newAnnotation.anatomy,
                "author": context.session.client,
                "context_uri": iframe.location.href,
                "coords": [
                    newAnnotation.shape.geometry.x,
                    newAnnotation.shape.geometry.y,
                    newAnnotation.shape.geometry.width,
                    newAnnotation.shape.geometry.height
                ],
                "description": newAnnotation.description
            }];

            if (type == 'annotation') {
                // Add to 'annotation' table in ERMrest
                var annotationTable = image.entity.getRelatedTable(context.schemaName, 'annotation');
                return annotationTable.createEntity(newAnnotation, ['id', 'created']).then(function success(annotation) {
                    // Then add to Annotorious
                    iframe.postMessage({messageType: 'createAnnotation', content: annotation.data}, origin);
                    // Push new annotation to value provider
                    annotations.push(annotation);
                });
            } else if (type == 'section') {
                // Section annotations don't have anatomies
                delete newAnnotation[0].anatomy;

                // Add new section to 'section_annotation' table in ERMrest
                var sectionTable = image.entity.getRelatedTable(context.schemaName, 'section_annotation');
                return sectionTable.createEntity(newAnnotation, ['id', 'created']).then(function success(section) {
                    // Then add to Annotorious
                    iframe.postMessage({messageType: 'createSpecialAnnotation', content: section.data}, origin);
                    // Push new section to value provider
                    sections.push(section);
                });
            }
        }

        function cancelNewAnnotation() {
            iframe.postMessage({messageType: 'cancelAnnotationCreation'}, origin);
        }

        function updateAnnotation(annotation) {
            if (annotation.data.anatomy == 'No Anatomy') {
                annotation.data.anatomy = null;
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

        function highlightAnnotation(annotation) {
            iframe.postMessage({messageType: 'highlightAnnotation', content: annotation.data}, origin);
        };

        function centerAnnotation(annotation) {
            iframe.postMessage({messageType: 'centerAnnotation', content: annotation.data}, origin);
        };

        return {
            drawAnnotation: drawAnnotation,
            createAnnotation: createAnnotation,
            cancelNewAnnotation: cancelNewAnnotation,
            updateAnnotation: updateAnnotation,
            deleteAnnotation: deleteAnnotation,
            highlightAnnotation: highlightAnnotation,
            centerAnnotation: centerAnnotation
        };

    }]);
})();
