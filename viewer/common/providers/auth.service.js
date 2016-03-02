(function() {
    'use strict';

    angular.module('chaise.viewer')

    // A service to check whether the currently logged-in user is authorized to perform certain operations on resources.
    // This service deals with checks that require user data (e.g. username, group ID). Other checks that don't depend on user data
    // (e.g. an annotation cannot be deleted if it has comments) are found in the specific resource's service/factory.
    .service('AuthService', ['user', 'AlertsService', function AuthService(user, AlertsService) {
        var name = user.name;
        var role = user.role;

        function createAnnotation() {
            if (isReadOnly()) {
                return false;
            }
            return true;
        }

        function editAnnotation(annotation) {
            if (isReadOnly()) {
                return false;
            }

            if (role == 'curator') {
                return true;
            }

            if (role == 'annotator') {
                if (name == annotation.data.author) {
                    return true;
                }
                return false;
            }
            return false;
        }

        function deleteAnnotation(annotation) {
            if (isReadOnly()) {
                return false;
            }

            annotation = annotation.data;

            if (role == 'curator') {
                return true;
            }
            if (role == 'annotator') {
                if (name == annotation.author) {
                    return true;
                }
                return false;
            }
            return false;
        }

        function createComment() {
            if (isReadOnly()) {
                return false;
            }
            return true;
        }

        function editComment(comment) {
            if (isReadOnly()) {
                return false;
            }

            if (role == 'curator') {
                return true;
            }

            if (role == 'annotator') {
                if (name == comment.data.author) {
                    return true;
                }
                return false;
            }
        }

        function deleteComment(comment) {
            if (isReadOnly()) {
                return false;
            }

            if (role == 'curator') {
                return true;
            }

            if (role == 'annotator') {
                if (name == comment.data.author) {
                    return true;
                }
                return false;
            }
        }

        function editMetadata() {
            if (role == 'curator') {
                return true;
            }
            return false;
        }

        function isReadOnly() {
            if (role == 'user') {
                return true;
            }
            return false;
        }

        return {
            createAnnotation: createAnnotation,
            editAnnotation: editAnnotation,
            deleteAnnotation: deleteAnnotation,
            createComment: createComment,
            editComment: editComment,
            deleteComment: deleteComment,
            editMetadata: editMetadata
        };
    }]);
})();
