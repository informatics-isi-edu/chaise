'use strict';

describe('MetadaController', function() {
    var $controller, controller;

    beforeEach(function() {
        angular.mock.module('chaise.viewer');
        inject(function(_$controller_) {
            $controller = _$controller_;
        });
        controller = $controller('ImageMetadataController');
    });

    it('edit() should change the edit mode to true', function() {
        expect(controller.editMode).toEqual(false);
        controller.edit();
        expect(controller.editMode).toEqual(true);
    });

// TODO: figure out this test and why update/put don't exist
/*
    it('save() should change the edit mode to false and update the entity', function() {
        spyOn(controller.image.entity, 'update');

        controller.save();

        expect(controller.editMode).toEqual(false);
        expect(controller.image.entity.put).toHaveBeenCalled();
    });
*/
});
