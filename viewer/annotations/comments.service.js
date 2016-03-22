(function() {
    'use strict';

    angular.module('chaise.viewer')

    .service('CommentsService', ['ermrestClientFactory', 'comments', 'context', 'image', 'user', function(ermrestClientFactory, comments, context, image, user) {
        var commentsTable;
        var client = ermrestClientFactory.getClient(context.serviceURL);
        var catalog = client.getCatalog(context.catalogID);
        catalog.introspect().then(function success(schemas) {
            var schema = schemas[context.schemaName];
            commentsTable = schema.getTable('annotation_comment');
        });

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
                "author": user.name,
                "comment": newComment.comment
            }];

            var commentTable = image.entity.getRelatedTable(context.schemaName, 'annotation').getRelatedTable(context.schemaName, 'annotation_comment');
            return commentTable.createEntity(newComment, ['id', 'created']).then(function success(comment) {
                var annotationId = comment.data.annotation_id;
                if (!comments[annotationId]) {
                    comments[annotationId] = [];
                }
                comments[annotationId].push(comment);
                console.log('Comments: ', comments);
            }, function error(response) {
                console.log(response);
            });
        }

        function deleteComment(comment) {
            comment.delete().then(function success() {
                var annotationComments = comments[comment.data.annotation_id];
                var index = annotationComments.indexOf(comment);
                annotationComments.splice(index, 1);
            }, function error(response) {
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
