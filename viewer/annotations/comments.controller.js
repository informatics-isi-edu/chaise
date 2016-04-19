(function() {
    'use strict';

    angular.module('chaise.viewer')

    .controller('CommentsController', ['AuthService', 'CommentsService', '$scope', 'comments', function AnnotationsController(AuthService, CommentsService, $scope, comments) {
        var vm = this;
        vm.comments = comments;
        vm.newComment = {
            annotationId: null,
            comment: null,
            author: null
        };

        vm.allowCreate = AuthService.createComment;
        vm.allowDelete = AuthService.deleteComment;

        vm.createComment = createComment;
        vm.deleteComment = deleteComment;

        vm.authorName = authorName;

        function createComment(annotation) {
            vm.newComment.annotationId = annotation.data.id;
            CommentsService.createComment(vm.newComment);
            resetNewComment();
        }

        function deleteComment(comment) {
            CommentsService.deleteComment(comment);
        }

        // Set newComment back to its default vaules
        function resetNewComment() {
            vm.newComment = {
                annotationId: null,
                comment: null,
                author: null
            };
        }

        // Used to set the author based on the info object from the user object (user.info) that is set on every comment
        // The info object is the session.client object and may contain a combination of display_name, full_name, and email
        function authorName(client) {
            return (client.display_name ? client.display_name : (client.full_name ? client.full_name : client.email ));
        }
    }]);
})();
