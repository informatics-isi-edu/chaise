(function() {
    'use strict';

    angular.module('chaise.viewer')

    .controller('CommentsController', ['CommentsService', '$scope', 'annotations', 'comments', function AnnotationsController(CommentsService, $scope, annotations, comments) {
        var vm = this;
        vm.annotations = annotations;
        vm.comments = comments;
        vm.newComment = null;

        vm.createComment = createComment;

        function createComment() {
            vm.newComment.annotationId = $scope.annotation.data.id;
            CommentsService.createComment(vm.newComment);
            vm.newComment = null;
        }
    }]);
})();
