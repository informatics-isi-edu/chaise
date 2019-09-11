(function() {
    'use strict';

    angular.module('chaise.recordset')

    // Register the recordset controller
    .controller('recordsetController', ['ConfigUtils', 'DataUtils', 'messageMap', 'recordsetModel', 'Session', 'UiUtils', 'UriUtils', '$log', '$rootScope', '$scope', '$timeout', '$window',
        function(ConfigUtils, DataUtils, messageMap, recordsetModel, Session, UiUtils, UriUtils, $log, $rootScope, $scope, $timeout, $window) {

        var ctrl = this;
        var chaiseConfig = ConfigUtils.getConfigJSON();
        var dcctx = ConfigUtils.getContextJSON();
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
            $window.location.replace($scope.permalink());
            $rootScope.location = $window.location.href;
        }

        $rootScope.$on('reference-modified', function() {
            updateLocation();
        });

        $scope.permalink = function() {

            // before run, use window location
            if (!recordsetModel.reference) {
                return $window.location.href;
            }

            //TODO we could use the reference.appLink instead of this
            var url = UriUtils.chaiseBaseURL() + "/recordset/#" + recordsetModel.reference.location.catalog + "/" +
                recordsetModel.reference.location.compactPath;

            // add sort modifier
            if (recordsetModel.reference.location.sort)
                url = url + recordsetModel.reference.location.sort;

            // add paging modifier
            if (recordsetModel.reference.location.paging)
                url = url + recordsetModel.reference.location.paging;

            // add ermrestjs supported queryParams
            if (recordsetModel.reference.location.queryParamsString) {
                url = url + "?" + recordsetModel.reference.location.queryParamsString;
            }

            // add hideNavbar if present/defined
            if (dcctx.hideNavbar) {
                url = url + (recordsetModel.reference.location.queryParamsString ? "&" : "?") + "hideNavbar=" + dcctx.hideNavbar;
            }

            return url;
        };

        $scope.versionDisplay = function () {
            return UiUtils.humanizeTimestamp(recordsetModel.reference.location.versionAsMillis);
        }

        $scope.versionDate = function () {
            return UiUtils.versionDate(recordsetModel.reference.location.versionAsMillis);
        }
    }]);
})();
