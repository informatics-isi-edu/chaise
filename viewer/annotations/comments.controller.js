(function() {
    'use strict';

    angular.module('chaise.viewer')

    .controller('CommentsController', ['CommentsService', '$scope', 'comments', function AnnotationsController(CommentsService, $scope, comments) {
        var vm = this;
        vm.comments = comments;
        vm.newComment = null;
        // Each CommentsController inherits the scope of the current annotation
        vm.annotationId = $scope.annotation.data.id;

        vm.createComment = createComment;
        vm.getNumComments = getNumComments;
        vm.deleteComment = deleteComment;

        function createComment() {
            vm.newComment.annotationId = vm.annotationId;
            CommentsService.createComment(vm.newComment);
            vm.newComment = null;
        }

        // Get the # of comments an annotation has
        function getNumComments() {
            CommentsService.getNumComments(vm.annotationId);
        }

        function deleteComment(comment) {
            CommentsService.deleteComment(comment);
        }
    }]);
})();
