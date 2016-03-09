'use strict';

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

    it('should define a getNumComments() method', function() {
        expect(mockAnnotationsService.getNumComments).toBeDefined();
        expect(mockAnnotationsService.getNumComments).toEqual(jasmine.any(Function));
    });
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

    it('should have at least one sidebar', function() {
        var controller = $controller('SidebarController');
        expect(controller.sidebars.length).toBeGreaterThan(0);
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

    it('should define a downloadView() method', function() {
        var controller = $controller('OSDController');
        expect(controller.downloadView).toBeDefined();
        expect(controller.downloadView).toEqual(jasmine.any(Function));
    });

    it('should define a zoomInView() method', function() {
        var controller = $controller('OSDController');
        expect(controller.zoomInView).toBeDefined();
        expect(controller.zoomInView).toEqual(jasmine.any(Function));
    });

    it('should define a zoomOutView() method', function() {
        var controller = $controller('OSDController');
        expect(controller.zoomOutView).toBeDefined();
        expect(controller.zoomOutView).toEqual(jasmine.any(Function));
    });

    it('should define a homeView() method', function() {
        var controller = $controller('OSDController');
        expect(controller.homeView).toBeDefined();
        expect(controller.homeView).toEqual(jasmine.any(Function));
    });
});
