'use strict';

// TODO: refactor these tests
// FACTORY: AnnotationsService
describe('AnnotationsService', function() {
    var mockAnnotationsService = null;

    beforeEach(function() {
        // Load the module that contains the service
        angular.mock.module('chaise.viewer');
        inject(function(AnnotationsService) {
            mockAnnotationsService = AnnotationsService;
        });
    });

//TODO
    it('should define a drawAnnotation() method', function() {
        expect(mockAnnotationsService.drawAnnotation).toBeDefined();
        expect(mockAnnotationsService.drawAnnotation).toEqual(jasmine.any(Function));
    });

    it('should define a cancelNewAnnotation() method', function() {
        expect(mockAnnotationsService.cancelNewAnnotation).toBeDefined();
        expect(mockAnnotationsService.cancelNewAnnotation).toEqual(jasmine.any(Function));
    });

    it('should define a createAnnotation() method', function() {
        expect(mockAnnotationsService.createAnnotation).toBeDefined();
        expect(mockAnnotationsService.createAnnotation).toEqual(jasmine.any(Function));
    });

    it('should define a updateAnnotation() method', function() {
        expect(mockAnnotationsService.updateAnnotation).toBeDefined();
        expect(mockAnnotationsService.updateAnnotation).toEqual(jasmine.any(Function));
    });

    it('should define a deleteAnnotation() method', function() {
        expect(mockAnnotationsService.deleteAnnotation).toBeDefined();
        expect(mockAnnotationsService.deleteAnnotation).toEqual(jasmine.any(Function));
    });

    it('should define a centerAnnotation() method', function() {
        expect(mockAnnotationsService.centerAnnotation).toBeDefined();
        expect(mockAnnotationsService.centerAnnotation).toEqual(jasmine.any(Function));
    });
});
