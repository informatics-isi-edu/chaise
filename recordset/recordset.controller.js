(function() {
    'use strict';

    angular.module('chaise.recordset')

    // Register the recordset controller
    .controller('recordsetController', ['ConfigUtils', 'DataUtils', 'messageMap', 'recordsetModel', 'Session', 'UiUtils', 'UriUtils', '$log', '$rootScope', '$scope', '$timeout', '$window',
        function(ConfigUtils, DataUtils, messageMap, recordsetModel, Session, UiUtils, UriUtils, $log, $rootScope, $scope, $timeout, $window) {

        var ctrl = this;
        var chaiseConfig = ConfigUtils.getConfigJSON();
        $scope.vm = recordsetModel;

        $scope.makeSafeIdAttr = DataUtils.makeSafeIdAttr;

        recordsetModel.RECORDEDIT_MAX_ROWS = 200;
        ctrl.showExportButton = (chaiseConfig.showExportButton === true);
        $scope.navbarBrand = (chaiseConfig.navbarBrand !== undefined ?  chaiseConfig.navbarBrand : "");
        $scope.navbarBrandImage = (chaiseConfig.navbarBrandImage !== undefined ? chaiseConfig.navbarBrandImage : "");
        $scope.navbarBrandText = (chaiseConfig.navbarBrandText !== undefined ? chaiseConfig.navbarBrandText : "Chaise");
        $scope.tooltip = messageMap.tooltip;

        function updateLocation() {
            $window.scrollTo(0, 0);
            $window.location.replace(UriUtils.getRecordsetLink(recordsetModel.reference));
            $rootScope.location = $window.location.href;
        }

        $rootScope.$on('reference-modified', function() {
            updateLocation();
        });

        $scope.versionDisplay = function () {
            return UiUtils.humanizeTimestamp(recordsetModel.reference.location.versionAsMillis);
        }

        $scope.versionDate = function () {
            return UiUtils.versionDate(recordsetModel.reference.location.versionAsMillis);
        }
    }]);
})();
