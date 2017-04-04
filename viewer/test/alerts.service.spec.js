'use strict';

describe('AlertsService', function() {
    var alert, mockAlertsService = null;

    beforeEach(function() {
        angular.mock.module('chaise.viewer');
        inject(function(AlertsService) {
            mockAlertsService = AlertsService;
        });
    });

    it('addAlert() should add an alert properly', function(done) {
        alert = mockAlertsService.addAlert('This is a message', 'error');
        expect(mockAlertsService.alerts.length).toEqual(1);
        done();
    });

    it('deleteAlert() should remove an alert properly', function() {
        mockAlertsService.alerts.push(alert);
        expect(mockAlertsService.alerts.indexOf(alert)).toBeGreaterThan(-1);
        mockAlertsService.deleteAlert(alert);
        expect(mockAlertsService.alerts.indexOf(alert)).toEqual(-1);
    });
});
