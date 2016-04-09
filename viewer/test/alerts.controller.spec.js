'use strict';

describe('AlertsController', function() {
    var $controller, controller, mockAlertsService = null;

    beforeEach(function() {
        angular.mock.module('chaise.viewer');
        inject(function(_$controller_, AlertsService) {
            $controller = _$controller_;
            mockAlertsService = AlertsService;
        });
        controller = $controller('AlertsController');
    });

    it('should define the alerts array as empty', function() {
        expect(controller.alerts).toBeDefined();
        expect(controller.alerts.length).toBe(0);
    });

    it('closeAlert() should close the alert', function() {
        spyOn(mockAlertsService, 'deleteAlert');
        controller.closeAlert();
        expect(mockAlertsService.deleteAlert).toHaveBeenCalled();
    });
});
