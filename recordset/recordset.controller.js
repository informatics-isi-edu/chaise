(function() {
    'use strict';

    angular.module('chaise.recordset')

    // Register the recordset controller
    // TODO We should use the contoller-as syntax instead of attaching attributes to the scope.
    .controller('recordsetController', ['ConfigUtils', 'DataUtils', 'messageMap', 'recordsetModel', 'Session', 'UiUtils', 'UriUtils', '$log', '$rootScope', '$scope', '$timeout', '$window',
        function(ConfigUtils, DataUtils, messageMap, recordsetModel, Session, UiUtils, UriUtils, $log, $rootScope, $scope, $timeout, $window) {

        var chaiseConfig = ConfigUtils.getConfigJSON();
        $scope.vm = recordsetModel;
        $scope.makeSafeIdAttr = DataUtils.makeSafeIdAttr;

        function updateLocation() {
            $window.scrollTo(0, 0);
            $window.history.replaceState({}, '', UriUtils.getRecordsetLink(recordsetModel.reference));
        }

        $rootScope.$on('reference-modified', function() {
            updateLocation();
        });
    }]);
})();
