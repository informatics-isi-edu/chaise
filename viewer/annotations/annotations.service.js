(function() {
    'use strict';

    angular.module('chaise.viewer')

    .factory('AnnotationsService', ['context', 'image', 'annotations', 'sections', 'CommentsService', 'AlertsService', '$window', '$q', function(context, image, annotations, sections, CommentsService, AlertsService, $window, $q) {
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

            if (type == 'section_annotation') {
                // Section annotations don't need anatomies
                delete newAnnotation[0].anatomy;
            }
            var table = image.entity.getRelatedTable(context.schemaName, type);
            return table.createEntity(newAnnotation, ['id', 'created']).then(function success(annotation) {
                var messageType = '';
                switch (type) {
                    case 'annotation':
                        messageType = 'createAnnotation';
                        annotations.push(annotation);
                        break;
                    case 'section_annotation':
                        messageType = 'createSpecialAnnotation';
                        sections.push(annotation);
                        break;
                }
                iframe.postMessage({messageType: messageType, content: annotation.data}, origin);
            }, function error(response) {
                console.log(response);
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
            annotation.update();
            // Update in Annotorious
            iframe.postMessage({messageType: 'updateAnnotation', content: annotation.data}, origin);
        }

        function getNumComments(annotationId) {
            return CommentsService.getNumComments(annotationId);
        }

        // Returns a boolean
        function allowDelete(annotation) {
            // If there are comments on annotation, return false.
            if (getNumComments(annotation.data.id) > 0) {
                return false;
            }
            return true;
        }

        function deleteAnnotation(annotation) {
            if (allowDelete(annotation)) {
                // Delete from ERMrest
                annotation.delete().then(function success(response) {
                    // Delete from the 'annotations' or 'sections' provider
                    var type = annotation.table.name;
                    if (type == 'annotation') {
                        var index = annotations.indexOf(annotation);
                        annotations.splice(index, 1);
                    } else if (type == 'section_annotation') {
                        var index = sections.indexOf(annotation);
                        sections.splice(index, 1);
                    }

                    // Delete in Annotorious
                    iframe.postMessage({messageType: 'deleteAnnotation', content: annotation.data}, origin);
                }, function error(response) {
                    console.log(response);
                });
            } else {
                AlertsService.setAlert({
                    type: 'error',
                    message: 'Sorry, this annotation cannot be deleted because there are comments on it.'
                });
            };
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
            centerAnnotation: centerAnnotation,
            getNumComments: getNumComments
        };

    }]);
})();
