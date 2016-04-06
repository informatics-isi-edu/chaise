'use strict';

describe('AuthService', function() {
    var mockAuthService = null;

    beforeEach(function() {
        angular.mock.('chaise.viewer');
        inject(function(AuthService) {
            mockAuthService = AuthService;
        });
    });

    it('createAnnotation() should return properly based on the role of the user', function() {
        mockAuthService.user.role = 'curator';
        var permitted = mockAuthService.createAnnotation();
        expect(permitted).toEqual(true);

        mockAuthService.user.role = 'annotator';
        permitted = mockAuthService.createAnnotation();
        expect(permitted).toEqual(true);

        mockAuthService.user.role = 'user';
        permitted = mockAuthService.createAnnotation();
        expect(permitted).toEqual(false);
    });

    it('editAnnotation() should return properly based on the role of the user', function() {
        var annotation = { data: { author: 'tester' }};

        mockAuthService.user.role = 'curator';
        var permitted = mockAuthService.editAnnotation(annotation);
        expect(permitted).toEqual(true);

        mockAuthService.user.role = 'annotator';
        mockAuthService.user.name = 'tester';
        permitted = mockAuthService.editAnnotation(annotation);
        expect(permitted).toEqual(true);

        mockAuthService.user.role = 'user';
        permitted = mockAuthService.editAnnotation(annotation);
        expect(permitted).toEqual(false);
    });

    it('deleteAnnotation() should return properly based on the role of the user', function() {
        var annotation = { data: { author: 'tester' }};

        mockAuthService.user.role = 'curator';
        var permitted = mockAuthService.deleteAnnotation(annotation);
        expect(permitted).toEqual(true);

        mockAuthService.user.role = 'annotator';
        mockAuthService.user.name = 'tester';
        permitted = mockAuthService.deleteAnnotation(annotation);
        expect(permitted).toEqual(true);

        mockAuthService.user.role = 'user';
        permitted = mockAuthService.deleteAnnotation(annotation);
        expect(permitted).toEqual(false);
    });

    it('createComment() should return properly based on the role of the user', function() {
        mockAuthService.user.role = 'curator';
        var permitted = mockAuthService.createComment();
        expect(permitted).toEqual(true);

        mockAuthService.user.role = 'annotator';
        permitted = mockAuthService.createComment();
        expect(permitted).toEqual(true);

        mockAuthService.user.role = 'user';
        permitted = mockAuthService.createComment();
        expect(permitted).toEqual(false);
    });

    it('deleteComment() should return properly based on the role of the user', function() {
        var comment = { data: { author: 'tester' }};

        mockAuthService.user.role = 'curator';
        var permitted = mockAuthService.deleteComment(comment);
        expect(permitted).toEqual(true);

        mockAuthService.user.role = 'annotator';
        mockAuthService.user.name = 'tester';
        permitted = mockAuthService.deleteComment(comment);
        expect(permitted).toEqual(true);

        mockAuthService.user.role = 'user';
        permitted = mockAuthService.deleteComment(comment);
        expect(permitted).toEqual(false);
    });

    it('editMetadata() should return properly based on the role of the user', function() {
        mockAuthService.user.role = 'curator';
        var permitted = mockAuthService.editMetadata();
        expect(permitted).toEqual(true);

        mockAuthService.user.role = 'user';
        permitted = mockAuthService.editMetadata();
        expect(permitted).toEqual(false);
    });
});
