'use strict';

describe('CommentsController', function() {
    var $controller, $scope, controller, mockCommentsService = null;

    beforeEach(function() {
        angular.mock.module('chaise.viewer');
        inject(function(_$controller_, CommentsService) {
            $controller = _$controller_;
            mockCommentsService = CommentsService;
        });
        $scope = { annotation: { data: { id: 'id' }}};
        controller = $controller('CommentsController', { $scope: $scope });
    });

    it('should define a newComment', function() {
        expect(controller.newComment.annotationId).toEqual(controller.annotationId);
        expect(controller.newComment.comment).toBeNull();
        expect(controller.newComment.author).toBeNull();
    });

    it('should be able to create a comment', function() {
        var comment = 'modified comment';
        var author = 'user';
        var originalComment = controller.newComment;
        spyOn(mockCommentsService, 'createComment');
        controller.newComment.comment = comment;
        controller.newComment.author = author;

        controller.createComment();

        expect(mockCommentsService.createComment).toHaveBeenCalled();
        expect(mockCommentsService.createComment).toHaveBeenCalledWith(originalComment);

        // Expectations for resetNewComment() function
        expect(controller.newComment.comment).not.toEqual(comment);
        expect(controller.newComment.comment).toBeNull();
        expect(controller.newComment.author).not.toEqual(author);
        expect(controller.newComment.author).toBeNull();
    });

    it('should be able to get the number of comments', function() {
        spyOn(mockCommentsService, 'getNumComments');

        controller.getNumComments();

        expect(mockCommentsService.getNumComments).toHaveBeenCalled();
    });

    it('should be able to delete comments', function() {
        spyOn(mockCommentsService, 'deleteComment');
        var comment = {
            annotationId: 'id',
            comment: 'some commment',
            author: 'user'
        }

        controller.deleteComment(comment);

        expect(mockCommentsService.deleteComment).toHaveBeenCalled();
    });
});
