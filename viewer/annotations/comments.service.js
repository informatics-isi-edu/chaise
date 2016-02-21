(function() {
    'use strict';

    angular.module('chaise.viewer')

    .service('CommentsService', ['ermrestClientFactory', 'comments', 'context', function(ermrestClientFactory, comments, context) {

        function createComment(newComment) {
            newComment = [{
                "annotation_id": newComment.annotationId,
                "author": context.session.client,
                "comment": newComment.comment
            }];

            // Temporary code to get a reference to 'annotation_comment' table
            var client = ermrestClientFactory.getClient(context.serviceURL);
            var catalog = client.getCatalog(context.catalogID);
            catalog.introspect().then(function success(schemas) {
                var schema = schemas[context.schemaName];
                var commentsTable = schema.getTable('annotation_comment');
                commentsTable.createEntity(newComment, ['id', 'created']).then(function success(comment) {
                    // Not using the comment returned from ermrestClientFactory
                    // because it's incompatible with the comment objects loaded
                    // in viewer.module.js
                    var annotationId = newComment[0].annotation_id
                    if (!comments[annotationId]) {
                        comments[annotationId] = [];
                    }
                    comments[annotationId].push(newComment[0]);
                    console.log('Comments: ', comments);
                }, function error(response) {
                    console.log(response);
                });
            });
        }

        return {
            createComment: createComment
        };
    }]);
})();
