'use strict';

describe('AnnotationsController', function() {
    var $controller, $scope, controller, mockAnnotationsService = null;

    beforeEach(function() {
        angular.mock.module('chaise.viewer');
        inject(function(_$controller_, AnnotationsService) {
            $controller = _$controller_;
            mockAnnotationsService = AnnotationsService;
        });
        $scope = {};
        controller = $controller('AnnotationsController', { $scope: $scope });
    });

    // Unit tests for filterAnnotations(keys) function
    describe('should filter annotations properly based on the input keys', function() {
        var $filter, keys, annotation;

        // filter injection just for this test
        beforeEach(function() {
            inject(function(_$filter_) {
                $filter = _$filter_;
            });

            keys = ['description', 'anatomy', 'author', 'created'];
            annotation = {};
        });

        it('should return true if query is null', function() {
            controller.query = null;

            // syntax for testing our filterAnnotations() function:
            // assigns the function to a variable with input arguements
            var result = controller.filterAnnotations(keys);
            // result(annotation), where annotation is the object to be filtered
            expect(result(annotation)).toBe(true);
        });

        it('should return true if query is undefined', function() {
            controller.query = undefined;

            var result = controller.filterAnnotations(keys);
            expect(result(annotation)).toBe(true);
        });

        it('should return true if query is empty string', function() {
            controller.query = '';

            var result = controller.filterAnnotations(keys);
            expect(result(annotation)).toBe(true);
        });

        // need to figure out how to mock a query
        // controller.query = line 312 in index.html

        // something with an annotation array
        it('should return true if one of the annotation keys contains part of the query', function() {
            // TODO
        });

        it('should not modify annotation.anatomy if there was no match with the query', function() {
            // TODO
        });
    });

    // drawAnnotation(type) unit test
    it('should draw an annotation', function() {
        spyOn(mockAnnotationsService, 'drawAnnotation');
        controller.drawAnnotation('annotation');

        expect(controller.newAnnotationType).toEqual('annotation');
        expect(mockAnnotationsService.drawAnnotation).toHaveBeenCalled();
    });

    // createAnnotation() unit test
    it('should create an annotation', function() {
        spyOn(mockAnnotationsService, 'createAnnotation');
        controller.createAnnotation();

        expect(controller.createMode).toBe(false);
        expect(mockAnnotationsService.createAnnotation).toHaveBeenCalled();
        expect(mockAnnotationsService.createAnnotation).toHaveBeenCalledWith(controller.newAnnotation, controller.newAnnotationType);
        expect(controller.newAnnotationType).toBeNull();
    });

    // cancelNewAnnotation() unit test
    it('should cancel a new annotation', function() {
        spyOn(mockAnnotationsService, 'cancelNewAnnotation');
        controller.cancelNewAnnotation();

        expect(controller.createMode).toBe(false);
        expect(mockAnnotationsService.cancelNewAnnotation).toHaveBeenCalled();
    });

    // editAnnotation(annotation) unit test
    it('should edit an annotation based on the input annotation', function() {
        var annotation = {
            table: 'table',
            id: 'id',
            anatomy: 'Some Anatomy',
            description: 'This is the description'
        }

        controller.editAnnotation(annotation);

        expect(controller.editedAnnotation).toEqual('table-id');
    });

    // cancelEdit(annotation) unit test
    it('should cancel editting an annotation based on the input annotation', function() {
        var annotation = {
            table: 'table',
            id: 'id',
            anatomy: 'Some Anatomy',
            description: 'This is the description'
        }

        // To initialize the original annotation private/local variable
        controller.editAnnotation(annotation);
        controller.cancelEdit(annotation);

        expect(controller.editedAnnotation).toBeNull();
    });

    // updateAnnotation(annotation) unit test
    it('should update an annotation based on the input annotation', function() {
        var annotation = {
            table: 'table',
            id: 'id',
            anatomy: 'Some Anatomy',
            description: 'This is the description'
        }
        spyOn(mockAnnotationsService, 'updateAnnotation');

        controller.updateAnnotation(annotation);

        expect(controller.editedAnnotation).toBeNull();
        expect(mockAnnotationsService.updateAnnotation).toHaveBeenCalled();
        expect(mockAnnotationsService.updateAnnotation).toHaveBeenCalledWith(annotation);
    });

    // deleteAnnotation(annotation) unit test
    it('should delete an annotation based on the input annotation', function() {
        var annotation = {
            table: 'table',
            id: 'id',
            anatomy: 'Some Anatomy',
            description: 'This is the description'
        }
        spyOn(mockAnnotationsService, 'deleteAnnotation');

        controller.deleteAnnotation(annotation);

        expect(mockAnnotationsService.deleteAnnotation).toHaveBeenCalled();
        expect(mockAnnotationsService.deleteAnnotation).toHaveBeenCalledWith(annotation);
    });

    // centerAnnotation(annotation) unit test
    it('should center the input annotation', function() {
        var annotation = {
            table: 'table',
            id: 'id',
            anatomy: 'Some Anatomy',
            description: 'This is the description'
        }
        spyOn(mockAnnotationsService, 'centerAnnotation');

        controller.centerAnnotation(annotation);

        // Tests the functionality of the private function setHighlightedAnnotation()
        expect(controller.highlightedAnnotation).toEqual('table-id');
        // checks service function called
        expect(mockAnnotationsService.centerAnnotation).toHaveBeenCalled();
        expect(mockAnnotationsService.centerAnnotation).toHaveBeenCalledWith(annotation);
    });

    // getNumComments(annnotation) unit test
    it('should get the number of comments associated with the input annotation', function() {
        var annotation = {
            table: 'table',
            id: 'id',
            anatomy: 'Some Anatomy',
            description: 'This is the description'
        }
        spyOn(mockAnnotationsService, 'getNumComments');

        controller.getNumComments(annotation);

        expect(mockAnnotationsService.getNumComments).toHaveBeenCalled();
        expect(mockAnnotationsService.getNumComments).toHaveBeenCalledWith(annotation.id);
    });

    // TODO: figure out coordinates object
    // findAnnotation(coordinates) unit test
    it('should find an annotation based on the input coordinates', function() {

    });

    // scrollIntoView(elementId) unit test
    it('should scroll the view to show the input element', function() {

    });
});
