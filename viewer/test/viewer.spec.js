'use strict';

// FILTERS =====================================================================
describe('chaise.viewer filters', function() {
    var $filter;

    // Before each describe...
    beforeEach(function() {
        // ... mock the Viewer app
        angular.mock.module('chaise.filters');
        // ... mock the $filter service
        inject(function(_$filter_) {
            $filter = _$filter_;
        });
    });

    // Filter: toTitleCase
    describe('toTitleCase filter', function() {
        it('capitalizes the first letter of each word when given a string', function() {
            var foo = 'chaise is AWEsome';

            var result = $filter('toTitleCase')(foo);

            expect(result).toEqual('Chaise Is AWEsome');
        });
    });

    // Filter: underscoreToSpace
    describe('underscoreToSpace filter', function() {
        it('changes all underscores to spaces in a string', function() {
            var foo = 'chaise_is_AWEsome';

            var result = $filter('underscoreToSpace')(foo);

            expect(result).toEqual('chaise is AWEsome');
        });
    });
});
