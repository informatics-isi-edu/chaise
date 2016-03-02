(function() {
    'use strict';

    angular.module('chaise.viewer')

    .service('CommentsService', ['ermrestClientFactory', 'comments', 'context', 'user', function(ermrestClientFactory, comments, context, user) {
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

            commentsTable.createEntity(newComment, ['id', 'created']).then(function success(comment) {
                // Not using the comment returned from ermrestClientFactory
                // because it's incompatible with the comment objects loaded
                // in viewer.module.js
                newComment[0].id = comment.data.id;
                newComment[0].created = comment.data.created;
                var annotationId = newComment[0].annotation_id;
                if (!comments[annotationId]) {
                    comments[annotationId] = [];
                }
                comments[annotationId].push(newComment[0]);
                console.log('Comments: ', comments);
            }, function error(response) {
                console.log(response);
            });
        }

        function deleteComment(comment) {
            commentsTable.deleteEntity({"id": comment.id}).then(function success(response) {
                var annotationComments = comments[comment.annotation_id];
                var index = annotationComments.indexOf(comment);
                annotationComments.splice(index, 1);
            }, function error(response) {
                console.log(comment);
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
