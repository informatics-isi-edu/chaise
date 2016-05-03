'use strict';

describe('AnnotationsController', function() {
    var $controller, $scope, $q, controller, mockAnnotationsService, mockCommentsService = null;

    beforeEach(function() {
        angular.mock.module('chaise.viewer');
        inject(function(_$controller_, AnnotationsService, CommentsService, _$q_) {
            $controller = _$controller_;
            mockAnnotationsService = AnnotationsService;
            mockCommentsService = CommentsService;
            $q = _$q_;
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
            var result = controller.filterAnnotations(annotation);
            // result(annotation), where annotation is the object to be filtered
            expect(result).toBe(true);
        });

        it('should return true if query is undefined', function() {
            controller.query = undefined;

            var result = controller.filterAnnotations(keys);
            expect(result).toBe(true);
        });

        it('should return true if query is empty string', function() {
            controller.query = '';

            var result = controller.filterAnnotations(keys);
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
        spyOn(mockAnnotationsService, 'drawAnnotation');
        controller.drawAnnotation('annotation');

        expect(controller.newAnnotation.type).toEqual('annotation');
        expect(mockAnnotationsService.drawAnnotation).toHaveBeenCalled();
    });

    // createAnnotation() unit test
    it('should create an annotation', function() {
        // callFake is mocking the promise response object
        spyOn(mockAnnotationsService, 'createAnnotation').and.callFake(function() {
            var deferred = $q.defer();
            deferred.resolve('Remote call result');
            return deferred.promise;
        });
        controller.createAnnotation();

        expect(controller.createMode).toBe(false);
        expect(mockAnnotationsService.createAnnotation).toHaveBeenCalled();
        expect(mockAnnotationsService.createAnnotation).toHaveBeenCalledWith(controller.newAnnotation);
        // Make sure newAnnotation is returned to default values
        expect(controller.newAnnotation).toEqual({config:{color: controller.defaultColor}});
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

        expect(controller.editedAnnotationDomId).toEqual('table-id');
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
        // copy the annotation to mimic editing done view the UI
        controller.editedAnnotation = angular.copy(annotation);
        // change the description to mimic the edit
        controller.editedAnnotation.description = 'This is the description - edited';
        // must be set before the controller function is called and resets the editedAnnotation values
        var editedAnnotationControl = angular.copy(controller.editedAnnotation);
        spyOn(mockAnnotationsService, 'updateAnnotation');

        controller.updateAnnotation(annotation);

        expect(controller.editedAnnotation).toBeNull();
        expect(controller.editedAnnotationDomId).toBeNull();
        expect(mockAnnotationsService.updateAnnotation).toHaveBeenCalled();
        expect(mockAnnotationsService.updateAnnotation).toHaveBeenCalledWith(editedAnnotationControl);
    });

    //should not delete an annotation with comments

    // deleteAnnotation(annotation) unit test
    // chaiseConfig.confirmDelete = false
    it('should delete an annotation based on the input annotation with confirm delete false', function() {
        var annotation = {
            table: 'table',
            id: 'id',
            anatomy: 'Some Anatomy',
            description: 'This is the description'
        }
        spyOn(mockAnnotationsService, 'deleteAnnotation');
        chaiseConfig.confirmDelete = false;
        controller.deleteAnnotation(annotation);

        expect(mockAnnotationsService.deleteAnnotation).toHaveBeenCalled();
        expect(mockAnnotationsService.deleteAnnotation).toHaveBeenCalledWith(annotation);

        // reset change to chaiseConfig values because the file is loaded before all tests
        chaiseConfig.confirmDelete = false;
    });

    // deleteAnnotation(annotation) unit test
    // chaiseConfig.confirmDelete = true
    it('should delete an annotation based on the input annotation with confirm delete true', function() {
        //TODO add cases for hasComments
        pending();
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
        spyOn(mockCommentsService, 'getNumComments');

        controller.getNumComments(annotation);

        expect(mockCommentsService.getNumComments).toHaveBeenCalled();
        expect(mockCommentsService.getNumComments).toHaveBeenCalledWith(annotation.id);
    });

    // TODO: figure out coordinates object
    // findAnnotation(coordinates) unit test
    it('should find an annotation based on the input coordinates', function() {

    });

    // scrollIntoView(elementId) unit test
    it('should scroll the view to show the input element', function() {

    });
});
