(function() {
    'use strict';

    angular.module('chaise.viewer')

    .service('CommentsService', ['comments', 'context', 'image', 'user', function(comments, context, image, user) {
        function getNumComments(annotationId) {
            var _comments = comments[annotationId];
            if (!_comments) {
                return 0;
            }
            return _comments.length;
        }

        function createComment(newComment) {
            newComment = [{
                "annotation_id": newComment.annotationId,
                "author": user.session.client,
                "comment": newComment.comment
            }];

            var commentTable = image.entity.getRelatedTable(context.schemaName, 'annotation').getRelatedTable(context.schemaName, 'annotation_comment');
            return commentTable.createEntity(newComment, ['id', 'created', 'last_modified']).then(function success(comment) {
                var annotationId = comment.data.annotation_id;
                if (!comments[annotationId]) {
                    comments[annotationId] = [];
                }
                comments[annotationId].push(comment);
            }, function error(response) {
                AlertsService.addAlert({
                    type: 'error',
                    message: response
                });
                console.log(response);
            });
        }

        function deleteComment(comment) {
            comment.delete().then(function success() {
                var annotationComments = comments[comment.data.annotation_id];
                var index = annotationComments.indexOf(comment);
                annotationComments.splice(index, 1);
            }, function error(response) {
                AlertsService.addAlert({
                    type: 'error',
                    message: response
                });
                console.log(response);
            });
        }

        return {
            getNumComments: getNumComments,
            createComment: createComment,
            deleteComment: deleteComment
        };
    }]);
})();
