(function() {
    'use strict';

    angular.module('chaise.recordset')

    // Register the recordset controller
    .controller('recordsetController', ['ConfigUtils', 'DataUtils', 'messageMap', 'recordsetModel', 'Session', 'UiUtils', 'UriUtils', '$log', '$rootScope', '$scope', '$timeout', '$window',
        function(ConfigUtils, DataUtils, messageMap, recordsetModel, Session, UiUtils, UriUtils, $log, $rootScope, $scope, $timeout, $window) {

        var chaiseConfig = ConfigUtils.getConfigJSON();
        $scope.vm = recordsetModel;
        $scope.makeSafeIdAttr = DataUtils.makeSafeIdAttr;

        function updateLocation() {
            $window.scrollTo(0, 0);
            $window.location.replace(UriUtils.getRecordsetLink(recordsetModel.reference));
            $rootScope.location = $window.location.href;
        }

        $rootScope.$on('reference-modified', function() {
            updateLocation();
        });
    }]);
})();
