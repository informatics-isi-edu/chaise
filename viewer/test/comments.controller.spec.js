'use strict';

describe('CommentsController', function() {
    var $controller, controller;

    beforeEach(function() {
        angular.mock.module('chaise.viewer');
        inject(function(_$controller_) {
            $controller = _$controller_;
        });
        controller = $controller('CommentsController');
    });

    it('should define a newComment', function() {
        expect(controller.newComment.annotationId).toEqual(controller.annotationId);
        expect(controller.newComment.comment).toBeNull();
        expect(controller.newComment.author).toBeNull();
    });

    it('should be able to create a comment', function() {
        spyOn(CommentsService, 'createComment');
        controller.createComment();
        expect(CommentsService.createComment).toHaveBeenCalled();
        expect(controller.resetNewComment).toHaveBeenCalled();
    });

    it('should be able to get the number of comments', function() {
        spyOn(CommentsService, 'getNumComments');
        controller.getNumComments();
        expect(CommentsService.getNumComments).toHaveBeenCalled();
    });

    it('should be able to delete comments', function() {
        spyOn(CommentsService, 'deleteComment');
        var comment = {
            annotationId: 'id',
            comment: 'some commment',
            author: 'user'
        }
        controller.deleteComment(comment);
        expect(CommentsService.deleteComment).toHaveBeenCalled();
    });

    it('should be able to reset comments', function() {
        var comment = 'modified comment';
        var author = 'user';

        controller.newComment.comment = comment;
        controller.newComment.author = author;
        controller.resetNewComment();

        expect(controller.newComment.comment).not.toEqual(comment);
        expect(controller.newComment.comment).toBeNull();
        expect(controller.newComment.author).not.toEqual(author);
        expect(controller.newComment.author).toBeNull();
    });
});
