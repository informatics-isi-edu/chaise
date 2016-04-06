'use strict';

describe('MetadaController', function() {
    var $controller;

    beforeEach(function() {
        angular.mock.module('chaise.viewer');
        inject(function(_controller) {
            $controller = _controller;
        });
    });

    it('edit() should change the edit mode to true', function() {
        var controller = $controller('ImageMetadataController');
        expect(controller.editMode).toEqual(false);
        controller.edit();
        expect(controller.editMode).toEqual(true);
    });

    it('save() should change the edit mode to false and update the entity', function() {
        var controller = $controller('ImageMetadataController');
        spyOn(controller.image.entity, 'update');
        controller.save();
        expect(controller.editMode).toEqual(false);
        expect(controller.image.entity.update).toHaveBeenCalled();
    });
});
