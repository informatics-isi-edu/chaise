(function() {
    'use strict';

    angular.module('chaise.record')

    .controller('RecordController', ['$window', '$rootScope', 'AlertsService', function RecordController($window, $rootScope, AlertsService) {
        var vm = this;

        vm.alerts = AlertsService.alerts;
        vm.modifyRecord = chaiseConfig.editRecord === false ? false : true;

        vm.createRecord = function() {
            var newRef = $rootScope.reference.contextualize.entryCreate;
            var appURL = newRef.appLink;
            if (!appURL) {
                AlertsService.addAlert({type: 'error', message: "Application Error: app linking undefined for " + newRef.compactPath});
            }
            else {
                $window.location.href = appURL;
            }
        };

        vm.editRecord = function() {
            var newRef = $rootScope.reference.contextualize.entryEdit;
            var appURL = newRef.appLink;
            if (!appURL) {
                AlertsService.addAlert({type: 'error', message: "Application Error: app linking undefined for " + newRef.compactPath});
            }
            else {
                $window.location.href = appURL;
            }
        };

        vm.permalink = function getPermalink() {
            if (!$rootScope.reference) {
                return $window.location.href;
            }
            return $rootScope.context.mainURI;
        };

        vm.toRecordSet = function(ref) {
            var appURL = ref.appLink;
            if (!appURL) {
                AlertsService.addAlert({type: 'error', message: "Application Error: app linking undefined for " + ref.compactPath});
            }
            else {
                $window.location.href = appURL;
            }
        };
    }]);
})();
