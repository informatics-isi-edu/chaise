(function() {
    'use strict';

    angular.module('chaise.viewer')

    .factory('AnnotationsService', ['context', 'user', 'image', 'annotations', 'sections', 'CommentsService', 'AlertsService', '$window', '$q', function(context, user, image, annotations, sections, CommentsService, AlertsService, $window, $q) {
        var origin = $window.location.origin;
        var iframe = $window.frames[0];

        function drawAnnotation() {
            iframe.postMessage({messageType: 'drawAnnotation'}, origin);
        }

        function createAnnotation(newAnnotation) {
            if (newAnnotation.anatomy == 'No Anatomy') {
                newAnnotation.anatomy = null;
            }

            newAnnotation = [{
                "image_id": context.imageID,
                "anatomy": newAnnotation.anatomy,
                "author": user.session.client,
                "context_uri": iframe.location.href,
                "coords": [
                    newAnnotation.shape.geometry.x,
                    newAnnotation.shape.geometry.y,
                    newAnnotation.shape.geometry.width,
                    newAnnotation.shape.geometry.height
                ],
                "description": newAnnotation.description,
                "type": newAnnotation.type,
                "config": newAnnotation.config
            }];

            var type = newAnnotation[0].type;
            var tableName = '';
            var messageType = '';
            if (type == 'section') {
                // Section annotations don't need anatomies
                delete newAnnotation[0].anatomy;
                tableName = 'section_annotation';
                messageType = 'createSpecialAnnotation';
            } else if (type == 'arrow' || type == 'rectangle') {
                tableName = 'annotation';
                if (type == 'arrow') {
                    messageType = 'createArrowAnnotation';
                } else if (type == 'rectangle') {
                    messageType = 'createAnnotation';
                }
            }
            
            var table = image.entity.getRelatedTable(context.schemaName, tableName);
            return table.createEntity(newAnnotation, ['id', 'created']).then(function success(annotation) {
                if (type == 'arrow' || type == 'rectangle') {
                    annotations.push(annotation);
                } else if (type == 'section') {
                    sections.push(annotation);
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
            annotation.update().then(function success(response) {
                // Update in Annotorious
                iframe.postMessage({messageType: 'updateAnnotation', content: annotation.data}, origin);
            }, function error(response) {
                console.log(response);
            });
        }

        function getNumComments(annotationId) {
            return CommentsService.getNumComments(annotationId);
        }

        // Returns a boolean
        function hasComments(annotation) {
            // If there are comments on annotation, return false.
            if (getNumComments(annotation.data.id) > 0) {
                return true;
            }
            return false;
        }

        function deleteAnnotation(annotation) {
            if (!hasComments(annotation)) {
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
                AlertsService.addAlert({
                    type: 'error',
                    message: 'Sorry, this annotation cannot be deleted because there are comments on it.'
                });
            }
        }

        function centerAnnotation(annotation) {
            iframe.postMessage({messageType: 'centerAnnotation', content: annotation.data}, origin);
        };

        return {
            drawAnnotation: drawAnnotation,
            createAnnotation: createAnnotation,
            cancelNewAnnotation: cancelNewAnnotation,
            updateAnnotation: updateAnnotation,
            deleteAnnotation: deleteAnnotation,
            centerAnnotation: centerAnnotation,
            getNumComments: getNumComments
        };

    }]);
})();
