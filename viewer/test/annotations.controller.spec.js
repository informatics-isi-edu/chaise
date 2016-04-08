'use strict';

describe('AnnotationsController', function() {
    var $controller, controller;

    beforeEach(function() {
        angular.mock.module('chaise.viewer');
        inject(function(_$controller_) {
            $controller = _$controller_;
        });
        controller = $controller('AnnotationsController');
    });

    // Unit tests for filterAnnotations(keys) function
    describe('should filter annotations properly based on the input keys', function() {
        var $filter;
        // filter injection just for this test
        beforeEach(function() {
            inject(function(_$filter_) {
                $filter = _$filter_;
            });

            var keys = ['description', 'anatomy', 'author', 'created'];
            var annotation = {};
        });

        it('should return true if query is undefined or empty string', function() {
            controller.query = "";

            var result = $filter(controller.filterAnnotations)(annotation, keys);
            expect(result).toBe(true);
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
        spyOn(AnnotationsService, 'drawAnnotation');
        controller.drawAnnotation('annotation');

        expect(controller.newAnnotationType).toEqual('annotation');
        expect(AnnotationsService.drawAnnotation).toHaveBeenCalled();
    });

    // createAnnotation() unit test
    it('should create an annotation', function() {
        spyOn(AnnotationsService, 'createAnnotation');
        controller.createAnnotation();

        expect(controller.createMode).toBe(false);
        expect(AnnotationsService.createAnnotation).toHaveBeenCalled();
        expect(AnnotationsService.createAnnotation).toHaveBeenCalledWith(controller.newAnnotation, controller.newAnnotationType);
        expect(controller.newAnnotationType).toBeNull();
    });

    // cancelNewAnnotation() unit test
    it('should cancel a new annotation', function() {
        spyOn(AnnotationsService, 'cancelNewAnnotation');
        controller.cancelNewAnnotation();

        expect(controller.createMode).toBe(false);
        expect(AnnotationsService.cancelNewAnnotation).toHaveBeenCalled();
    });

    // editAnnotation(annotation) unit test
    it('should edit an annotation based on the input annotation', function() {
        var annotation = {
            table: { name: 'table' },
            data: {
                id: 'id',
                anatomy: 'Some Anatomy',
                description: 'This is the description'
            }
        }

        controller.editAnnotation(annotation);

        expect(controller.editedAnnotation).toEqual('table-id');
        expect(controller.originalAnnotation.description).toEqual(annotation.data.description);
        expect(controller.originalAnnotation.anatomy).toEqual(annotation.data.anatomy);
    });

    // cancelEdit(annotation) unit test
    it('should cancel editting an annotation based on the input annotation', function() {
        var annotation = {
            table: { name: 'table' },
            data: {
                id: 'id',
                anatomy: 'Some Anatomy',
                description: 'This is the description'
            }
        }

        controller.cancelEdit(annotation);

        expect(controller.editedAnnotation).toBeNull();
        expect(controller.data.description).toEqual(controller.originalAnnotation.description);
        expect(controller.data.anatomy).toEqual(controller.originalAnnotation.anatomy);
    });

    // updateAnnotation(annotation) unit test
    it('should update an annotation based on the input annotation', function() {
        var annotation = {
            table: { name: 'table' },
            data: {
                id: 'id',
                anatomy: 'Some Anatomy',
                description: 'This is the description'
            }
        }
        spyOn(AnnotationsService, 'updateAnnotation');

        controller.updateAnnotation(annotation);

        expect(controller.editedAnnotation).toBeNull();
        expect(AnnotationsService.updateAnnotation).toHaveBeenCalled();
        expect(AnnotationsService.updateAnnotation).toHaveBeenCalledWith(annotation);
    });

    // deleteAnnotation(annotation) unit test
    it('should delete an annotation based on the input annotation', function() {
        var annotation = {
            table: { name: 'table' },
            data: {
                id: 'id',
                anatomy: 'Some Anatomy',
                description: 'This is the description'
            }
        }
        spyOn(AnnotationsService, 'deleteAnnotation');

        controller.deleteAnnotation(annotation);

        expect(AnnotationsService.deleteAnnotation).toHaveBeenCalled();
        expect(AnnotationsService.deleteAnnotation).toHaveBeenCalledWith(annotation);
    });

    // setHighlightedAnnotation(annotation) unit test
    it('should set the highlighted annotation based on the input annotation', function() {
        var annotation = {
            table: { name: 'table' },
            data: {
                id: 'id',
                anatomy: 'Some Anatomy',
                description: 'This is the description'
            }
        }

        controller.setHighlightedAnnotation(annotation);

        expect(controller.highlightedAnnotation).toEqual('table-id');
    });

    // centerAnnotation(annotation) unit test
    it('should center the input annotation', function() {
        var annotation = {
            table: { name: 'table' },
            data: {
                id: 'id',
                anatomy: 'Some Anatomy',
                description: 'This is the description'
            }
        }
        spyOn(AnnotationsService, 'centerAnnotation');

        controller.centerAnnotation(annotation);

        expect(controller.highlightedAnnotation).toEqual('table-id');
        expect(AnnotationsService.centerAnnotation).toHaveBeenCalled();
        expect(AnnotationsService.centerAnnotation).toHaveBeenCalledWith(annotation);
    });

    // getNumComments(annnotation) unit test
    it('should get the number of comments associated with the input annotation', function() {
        var annotation = {
            table: { name: 'table' },
            data: {
                id: 'id',
                anatomy: 'Some Anatomy',
                description: 'This is the description'
            }
        }
        spyOn(AnnotationsService, 'getNumComments');

        controller.getNumComments(annotation);

        expect(AnnotationsService.getNumComments).toHaveBeenCalled();
        expect(AnnotationsService,getNumComments).toHaveBeenCalledWith(annotation);
    });

    // TODO: figure out coordinates object
    // findAnnotation(coordinates) unit test
    it('should find an annotation based on the input coordinates', function() {

    });

    // scrollIntoView(elementId) unit test
    it('should scroll the view to show the input element', function() {

    });
});
