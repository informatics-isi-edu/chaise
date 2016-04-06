'use strict';

describe('AlertsController', function() {
    var $controller;

    beforeEach(function() {
        angular.mock.module('chaise.viewer');
        inject(function(_controller) {
            $controller = _controller;
        });
    });

    it('closeAlert() should close the alert', function() {
        var controller = $controller('AlertsController');
        spyOn(AlertsService, 'deleteAlert');
        var val = controller.closeAlert();
        expect(AlertsService.deleteAlert).toHaveBeenCalled();
    });
});
