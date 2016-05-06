(function() {
    'use strict';

    angular.module('chaise.viewer')

    .factory('AnnotationsService', ['context', 'user', 'image', 'annotations', 'AlertsService', '$window', '$q', function(context, user, image, annotations, AlertsService, $window, $q) {
        var origin = $window.location.origin;
        var iframe = $window.frames[0];
        var table = null;

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

            if (!table) table = context.schema.tables.get('annotation');
            return table.entity.post(newAnnotation, ['id', 'created', 'last_modified']).then(function success(annotation) {
                // table.entity.post returns an array of objects
                var _annotation = annotation[0];
                _annotation.table = table.name;
                annotations.push(_annotation);
                iframe.postMessage({messageType: 'createAnnotation', content: _annotation}, origin);
                return _annotation;
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
            if (annotation.anatomy == 'No Anatomy') {
                annotation.anatomy = null;
            }

            var annArray = [];
            annArray.push(annotation);

            // Update in ERMrest
            if (!table) table = context.schema.tables.get('annotation');
            table.entity.put(annArray).then(function success(response) {
                // Returns an array of objects that were updated
                var _annotation = response[0]
                // Update in Annotorious
                iframe.postMessage({messageType: 'updateAnnotation', content: _annotation}, origin);
            }, function error(response) {
                AlertsService.addAlert({
                    type: 'error',
                    message: response
                });
                console.log(response);
            });
        }

        function deleteAnnotation(annotation) {
            // Delete from ERMrest
            if (!table) table = context.schema.tables.get('annotation');
            var deleteFilter = new ERMrest.BinaryPredicate(table.columns.get('id'), ERMrest.OPERATOR.EQUAL, annotation.id);
            table.entity.delete(deleteFilter).then(function success(response) {
                // Delete from the 'annotations' provider
                var index = annotations.indexOf(annotation);
                annotations.splice(index, 1);

                iframe.postMessage({messageType: 'deleteAnnotation', content: annotation}, origin);
            }, function error(response) {
                console.log(response);
            });
        }

        function centerAnnotation(annotation) {
            iframe.postMessage({messageType: 'centerAnnotation', content: annotation}, origin);
        };

        return {
            drawAnnotation: drawAnnotation,
            createAnnotation: createAnnotation,
            cancelNewAnnotation: cancelNewAnnotation,
            updateAnnotation: updateAnnotation,
            deleteAnnotation: deleteAnnotation,
            centerAnnotation: centerAnnotation
        };

    }]);
})();
