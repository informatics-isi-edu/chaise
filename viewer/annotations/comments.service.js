(function() {
    'use strict';

    angular.module('chaise.viewer')

    .service('CommentsService', ['comments', 'context', 'image', 'user', function(comments, context, image, user) {
        var table = null;

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

            if (!table) table = context.schema.tables.get('annotation_comment');
            return table.entity.post(newComment, ['id', 'created', 'last_modified']).then(function success(commentArr) {
                var comment = commentArr[0];
                var annotationId = comment.annotation_id;
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

        function updateComment(comment) {
            var commentArr = [];
            commentArr.push(comment);

            if (!table) table = context.schema.tables.get('annotation_comment');
            table.entity.put(commentArr).then(function success(response) {
                // Nothing to change in the state of the app
                // comments[comment.annotation_id][comment] is changed in place from the html
                console.log('Comments: ', comments);
            }, function error(repsonse) {
                console.log(response);
            });
        }

        function deleteComment(comment) {

            if (!table) table = context.schema.tables.get('annotation_comment');
            var deleteFilter = new ERMrest.BinaryPredicate(table.columns.get('id'), ERMrest.OPERATOR.EQUAL, comment.id);
            table.entity.delete(deleteFilter).then(function success() {
                var annotationComments = comments[comment.annotation_id];
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
            updateComment: updateComment,
            deleteComment: deleteComment
        };
    }]);
})();
