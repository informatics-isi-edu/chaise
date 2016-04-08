'use strict';

describe('AlertsController', function() {
    var $controller, controller;

    beforeEach(function() {
        angular.mock.module('chaise.viewer');
        inject(function(_$controller_) {
            $controller = _$controller_;
        });
        controller =  = $controller('AlertsController');
    });

    it('closeAlert() should close the alert', function() {
        spyOn(AlertsService, 'deleteAlert');
        controller.closeAlert();
        expect(AlertsService.deleteAlert).toHaveBeenCalled();
    });
});
