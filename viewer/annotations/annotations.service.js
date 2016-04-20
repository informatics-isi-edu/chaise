(function() {
    'use strict';

    angular.module('chaise.viewer')

    .factory('AnnotationsService', ['context', 'user', 'image', 'annotations', 'CommentsService', 'AlertsService', '$window', '$q', function(context, user, image, annotations, CommentsService, AlertsService, $window, $q) {
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
            var messageType = '';

            switch (type) {
                case 'section':
                    messageType = 'createSpecialAnnotation';
                    break;
                case 'rectangle':
                    messageType = 'createAnnotation';
                    break;
                case 'arrow':
                    messageType = 'createArrowAnnotation';
            }

            var table = image.entity.getRelatedTable(context.schemaName, 'annotation');
            return table.createEntity(newAnnotation, ['id', 'created', 'last_modified']).then(function success(annotation) {
                annotations.push(annotation);
                iframe.postMessage({messageType: messageType, content: annotation.data}, origin);
            }, function error(response) {
                AlertsService.addAlert({
                    type: 'error',
                    message: response
                });
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
                AlertsService.addAlert({
                    type: 'error',
                    message: response
                });
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
                    // Delete from the 'annotations' provider
                    var index = annotations.indexOf(annotation);
                    annotations.splice(index, 1);

                    // Delete in Annotorious
                    iframe.postMessage({messageType: 'deleteAnnotation', content: annotation.data}, origin);
                }, function error(response) {
                    AlertsService.addAlert({
                        type: 'error',
                        message: response
                    });
                    console.log(response);
                });
            } else {
                AlertsService.addAlert({
                    type: 'error',
                    message: 'Sorry, this annotation cannot be deleted because there is at least 1 comment on it.'
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
