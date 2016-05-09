(function() {
    'use strict';

    angular.module('chaise.viewer')

    // This factory checks whether the currently logged-in user is authorized to
    // perform certain operations on resources. Other checks that don't depend
    // on user data (e.g. an annotation cannot be deleted if it has comments) are
    // found in the specific resource's service/factory (e.g. AnnotationsService).
    .factory('AuthService', ['user', function AuthService(user) {
        function createAnnotation() {
            if (user.role == 'curator' || user.role == 'annotator') {
                return true;
            }
            return false;
        }

        function editAnnotation(annotation) {
            if (user.role == 'curator') {
                return true;
            }
            if (user.role == 'annotator' && isAuthor(annotation.author, user.session)) {
                return true;
            }
            return false;
        }

        function deleteAnnotation(annotation) {
            if (user.role == 'curator') {
                return true;
            }
            if (user.role == 'annotator' && isAuthor(annotation.author, user.session)) {
                return true;
            }
            return false;
        }

        function createComment() {
            if (user.role == 'curator' || user.role == 'annotator') {
                return true;
            }
            return false;
        }

        function editComment(comment) {
            if (user.role == 'curator') {
                return true;
            }
            if (user.role == 'annotator' && isAuthor(comment.author, user.session)) {
                return true;
            }
            return false;
        }

        function deleteComment(comment) {
            if (user.role == 'curator') {
                return true;
            }
            if (user.role == 'annotator' && isAuthor(comment.author, user.session)) {
                return true;
            }
            return false;
        }

        function editMetadata() {
            if (user.role == 'curator') {
                return true;
            }
            return false;
        }

        // Used to check group permission
        function isAuthor(author, userSession) {
            return userSession.attributes.map(function(a) {return a.id}).indexOf(author.id) > -1;
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
