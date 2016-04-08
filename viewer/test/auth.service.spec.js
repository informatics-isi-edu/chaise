'use strict';

describe('AuthService', function() {
    var mockAuthService = null;

    beforeEach(function() {
        angular.mock.('chaise.viewer');
        inject(function(AuthService) {
            mockAuthService = AuthService;
        });
    });

    describe('createAnnotation() should return properly based on the role of the user', function() {
        var permitted;

        it('should return true if the user is a curator', function() {
            mockAuthService.user.role = 'curator';
            permitted = mockAuthService.createAnnotation();
            expect(permitted).toBe(true);
        });

        it('should return true if the user is an annotator', function() {
            mockAuthService.user.role = 'annotator';
            permitted = mockAuthService.createAnnotation();
            expect(permitted).toBe(true);
        });

        it('should return false if the user is not an annotator or curator', function() {
            mockAuthService.user.role = 'user';
            permitted = mockAuthService.createAnnotation();
            expect(permitted).toBe(false);
        });
    });

    describe('editAnnotation() should return properly based on the role of the user', function() {
        var annotation, permitted;

        beforeEach(function() {
            annotation = { data: { author: 'tester' }};
        });

        it('should return true if the user is a curator', function() {
            mockAuthService.user.role = 'curator';
            permitted = mockAuthService.editAnnotation(annotation);
            expect(permitted).toBe(true);
        });

        it('should return true if the user is an annotator and they are the annotation owner', function() {
            mockAuthService.user.role = 'annotator';
            mockAuthService.user.name = 'tester';
            permitted = mockAuthService.editAnnotation(annotation);
            expect(permitted).toBe(true);
        });

        it('should return false if the user is not an annotator or curator', function() {
            mockAuthService.user.role = 'user';
            permitted = mockAuthService.editAnnotation(annotation);
            expect(permitted).toBe(false);
        });
    });

    describe('deleteAnnotation() should return properly based on the role of the user', function() {
        var annotation, permitted;

        beforeEach(function() {
            annotation  = { data: { author: 'tester' }};
        });

        it('should return true if the user is a curator', function() {
            mockAuthService.user.role = 'curator';
            permitted = mockAuthService.deleteAnnotation(annotation);
            expect(permitted).toBe(true);
        });

        it('should return true if the user is an annotator and they are the annotation owner', function() {
            mockAuthService.user.role = 'annotator';
            mockAuthService.user.name = 'tester';
            permitted = mockAuthService.deleteAnnotation(annotation);
            expect(permitted).toBe(true);
        });

        it('should return false if the user is not an annotator or curator', function() {
            mockAuthService.user.role = 'user';
            permitted = mockAuthService.deleteAnnotation(annotation);
            expect(permitted).toBe(false);
        });
    });

    describe('createComment() should return properly based on the role of the user', function() {
        var permitted;

        it('should return true if the user is a curator', function() {
            mockAuthService.user.role = 'curator';
            permitted = mockAuthService.createComment();
            expect(permitted).toBe(true);
        });

        it('should return true if the user is an annotator', function() {
            mockAuthService.user.role = 'annotator';
            permitted = mockAuthService.createComment();
            expect(permitted).toBe(true);
        });

        it('should return false if the user is not an annotator or curator', function() {
            mockAuthService.user.role = 'user';
            permitted = mockAuthService.createComment();
            expect(permitted).toBe(false);
        });
    });

    describe('deleteComment() should return properly based on the role of the user', function() {
        var comment, permitted;

        beforeEach(function() {
            comment = { data: { author: 'tester' }};
        });

        it('should return true if the user is a curator', function() {
            mockAuthService.user.role = 'curator';
            permitted = mockAuthService.deleteComment(comment);
            expect(permitted).toBe(true);
        });

        it('should return true if the user is an annotator and they are the annotation owner', function() {
            mockAuthService.user.role = 'annotator';
            mockAuthService.user.name = 'tester';
            permitted = mockAuthService.deleteComment(comment);
            expect(permitted).toBe(true);
        });

        it('should return false if the user is not an annotator or curator', function() {
            mockAuthService.user.role = 'user';
            permitted = mockAuthService.deleteComment(comment);
            expect(permitted).toBe(false);
        });
    });

    describe('editMetadata() should return properly based on the role of the user', function() {
        var permitted;

        it('should return true if the user is a curator', function() {
            mockAuthService.user.role = 'curator';
            permitted = mockAuthService.editMetadata();
            expect(permitted).toBe(true);
        });

        it('should return false if the user is not a curator', function() {
            mockAuthService.user.role = 'user';
            permitted = mockAuthService.editMetadata();
            expect(permitted).toBe(false);
        });
    });
});
