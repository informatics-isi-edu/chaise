'use strict';

describe('chaise.viewer module', function() {
    beforeEach(function() {
        angular.mock.module('chaise.viewer');
    });

    describe('AnnotationsService', function() {
        var mockAnnotationsService = null;
        beforeEach(inject(function(AnnotationsService) {
            mockAnnotationsService = AnnotationsService;
        }));
        it('should have drawAnnotation() method', function() {
            expect(mockAnnotationsService.drawAnnotation).toBeDefined();
        });
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
