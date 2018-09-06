(function() {
    'use strict';

    angular.module('chaise.viewer')

    .controller('CommentsController', ['AuthService', 'CommentsService', '$rootScope', '$scope', '$uibModal', 'comments', 'UriUtils', function AnnotationsController(AuthService, CommentsService, $rootScope, $scope, $uibModal, comments, UriUtils) {
        var chaiseConfig = Object.assign({}, $rootScope.chaiseConfig);
        var vm = this;
        vm.comments = comments;
        vm.newComment = {
            annotationId: null,
            comment: null,
            author: null
        };

        vm.allowCreate = AuthService.createComment;
        vm.allowEdit = AuthService.editComment;
        vm.allowDelete = AuthService.deleteComment;

        vm.createComment = createComment;
        vm.deleteComment = deleteComment;

        vm.editedComment = null; // Used to track which comment was editted so we can show the form properly
        var originalComment = null; // For reseting the comment data incase the user clicks cancel
        vm.editComment = editComment;
        vm.cancelEdit = cancelEdit;
        vm.updateComment = updateComment;

        vm.authorName = authorName;

        function createComment(annotationId) {
            vm.newComment.annotationId = annotationId;
            CommentsService.createComment(vm.newComment);
            resetNewComment();
        }

        function editComment(comment) {
            vm.editedComment = comment.table + '-' + comment.id;
            originalComment = {
                comment: comment.comment
            }
        }

        function cancelEdit(comment) {
            vm.editedComment = null;
            comment.comment = originalComment.comment;
        }

        function updateComment(comment) {
            CommentsService.updateComment(comment);
            vm.editedComment = null;
        }

        function deleteComment(comment) {
            if (chaiseConfig.confirmDelete == undefined ||  chaiseConfig.confirmDelete){
                var modalInstance = $uibModal.open({
                    templateUrl: UriUtils.chaiseDeploymentPath() + 'common/templates/delete-link/confirm_delete.modal.html',
                    controller: 'ConfirmDeleteController',
                    controllerAs: 'ctrl',
                    size: 'sm'
                });

                modalInstance.result.then(function () {
                    CommentsService.deleteComment(comment);
                    console.log('comment deleted');
                }, function () {
                    console.log('Modal dismissed');
                });
            } else {
                CommentsService.deleteComment(comment);
                console.log('comment deleted');
            }
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
