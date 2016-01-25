(function() {
    'use strict';

    angular.module('chaise.viewer')

    .factory('AnnotationsService', ['annotations', '$window', function(annotations, $window) {
        function deleteAnnotation(annotation) {
            // Delete from ERMrest
            annotation.delete();
            // Delete from 'annotations' provider
            var index = annotations.indexOf(annotation);
            annotations.splice(index, 1);
            // Delete in Annotorious
            $window.frames[0].postMessage({messageType: 'deleteAnnotation', content: annotation.data}, window.location.origin);
        }

        return {
            deleteAnnotation: deleteAnnotation
        };
    }]);
})();
