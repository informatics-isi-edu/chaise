(function() {
    'use strict';

    angular.module('chaise.record')

    .controller('RecordController', ['AlertsService', '$log', '$rootScope', '$window', function RecordController(AlertsService, $log, $rootScope, $window) {
        var vm = this;

        vm.alerts = AlertsService.alerts;
        vm.modifyRecord = chaiseConfig.editRecord === false ? false : true;
        vm.showEmptyRelatedTables = false;

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

        vm.deleteRecord = function() {
            $rootScope.reference.delete().then(function deleteSuccess() {
                //success, go to databrowser or home
                $window.location.href = (chaiseConfig.dataBrowser ? chaiseConfig.dataBrowser : $window.location.origin);
            }, function deleteFail(error) {
                AlertsService.addAlert({type: 'error', message: error.message});
                $log.warn(response);
            });
        }

        vm.permalink = function getPermalink() {
            if (!$rootScope.reference) {
                return $window.location.href;
            }
            return $rootScope.context.mainURI;
        };

        vm.toRecordSet = function(ref) {
            var appURL = ref.appLink;
            if (!appURL) {
                return AlertsService.addAlert({type: 'error', message: "Application Error: app linking undefined for " + ref.compactPath});
            }
            return $window.location.href = appURL;
        };

        vm.showRelatedTable = function(i) {
            var isFirst = false, prevTableHasLoaded = false;
            if ($rootScope.tableModels && $rootScope.tableModels[i]) {
                if (i === 0) {
                    isFirst = true;
                } else if ($rootScope.tableModels[i-1]) {
                    prevTableHasLoaded = $rootScope.tableModels[i-1].hasLoaded;
                }

                if (vm.showEmptyRelatedTables) {
                    return isFirst || prevTableHasLoaded;
                }
                return (isFirst || prevTableHasLoaded) && $rootScope.tableModels[i].rowValues.length > 0;
            }
        };
    }]);
})();
