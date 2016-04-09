'use strict';

describe('AlertsService', function() {
    var alert, mockAlertsService = null;

    beforeEach(function() {
        angular.mock.module('chaise.viewer');
        inject(function(AlertsService) {
            mockAlertsService = AlertsService;
        });

        alert = {
            type: 'info',
            message: 'This is a message'
        };
    });

    it('addAlert() should add an alert properly', function() {
        mockAlertsService.addAlert(alert);
        expect(mockAlertsService.alerts.length).toEqual(1);
    });

    it('deleteAlert() should remove an alert properly', function() {
        mockAlertsService.alerts.push(alert);
        expect(mockAlertsService.alerts.indexOf(alert)).toBeGreaterThan(-1);
        mockAlertsService.deleteAlert(alert);
        expect(mockAlertsService.alerts.indexOf(alert)).toEqual(-1);
    });
});
