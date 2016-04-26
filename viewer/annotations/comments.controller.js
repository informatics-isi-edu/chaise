(function() {
    'use strict';

    angular.module('chaise.viewer')

    .controller('CommentsController', ['AuthService', 'CommentsService', '$scope', 'comments', function AnnotationsController(AuthService, CommentsService, $scope, comments) {
        var vm = this;
        vm.annotationId = $scope.annotation.id;
        vm.comments = comments;
        vm.newComment = {
            annotationId: vm.annotationId,
            comment: null,
            author: null
        };

        vm.allowCreate = AuthService.createComment;
        vm.allowDelete = AuthService.deleteComment;

        vm.createComment = createComment;
        vm.getNumComments = getNumComments;
        vm.deleteComment = deleteComment;

        function createComment() {
            CommentsService.createComment(vm.newComment);
            resetNewComment();
        }

        // Get the # of comments an annotation has
        function getNumComments() {
            CommentsService.getNumComments(vm.annotationId);
        }

        function deleteComment(comment) {
            CommentsService.deleteComment(comment);
        }

        // Set newComment back to its default vaules
        function resetNewComment() {
            vm.newComment = {
                annotationId: vm.annotationId,
                comment: null,
                author: null
            };
        }
    }]);
})();
