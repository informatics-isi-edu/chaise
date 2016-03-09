'use strict';

// FACTORY: AnnotationsService
describe('AnnotationsService', function() {
    var mockAnnotationsService = null;

    beforeEach(function() {
        angular.mock.module('chaise.viewer');
        inject(function(AnnotationsService) {
            mockAnnotationsService = AnnotationsService;
        });
    });

    it('should define a drawAnnotation() method', function() {
        expect(mockAnnotationsService.drawAnnotation).toBeDefined();
        expect(mockAnnotationsService.drawAnnotation).toEqual(jasmine.any(Function));
    });

    it('should define a cancelNewAnnotation() method', function() {
        expect(mockAnnotationsService.cancelNewAnnotation).toBeDefined();
        expect(mockAnnotationsService.cancelNewAnnotation).toEqual(jasmine.any(Function));
    });

    it('should define a highlightAnnotation() method', function() {
        expect(mockAnnotationsService.highlightAnnotation).toBeDefined();
        expect(mockAnnotationsService.highlightAnnotation).toEqual(jasmine.any(Function));
    });

    // TODO: Test the rest of the methods in the service

    // TODO: Figure out how to mock the postMessages...
});

// FILTERS =====================================================================
describe('chaise.viewer filters', function() {
    var $filter;

    // Before each describe...
    beforeEach(function() {
        // ... mock the Viewer app
        angular.mock.module('chaise.viewer');
        // ... mock the $filter service
        inject(function(_$filter_) {
            $filter = _$filter_;
        });
    });

    // Filter: toTitleCase
    describe('toTitleCase filter', function() {
        it('capitalizes the first letter of each word when given a string', function() {
            var toTitleCase = $filter('toTitleCase');
            expect(toTitleCase('chaise is AWEsome')).toEqual('Chaise Is AWEsome');
        });
    });

    // Filter: underscoreToSpace
    describe('underscoreToSpace filter', function() {
        it('changes all underscores to spaces in a string', function() {
            var underscoreToSpace = $filter('underscoreToSpace');
            expect(underscoreToSpace('chaise_is_AWEsome')).toEqual('chaise is AWEsome');
        });
    });
});

describe('SidebarController', function() {
    var $controller;

    beforeEach(function() {
        angular.mock.module('chaise.viewer');
        inject(function(_$controller_) {
            $controller = _$controller_;
        });
    });

    it('setSidebar() should set the sidebar', function() {
        var controller = $controller('SidebarController');
        expect(controller.sidebar).toEqual(controller.sidebars[0]);
        controller.setSidebar('exampleSidebar');
        expect(controller.sidebar).toEqual('exampleSidebar');
    });
});

describe('OSDController', function() {
    var $controller;

    beforeEach(function() {
        angular.mock.module('chaise.viewer');
        inject(function(_$controller_) {
            $controller = _$controller_;
        });
    });
});
