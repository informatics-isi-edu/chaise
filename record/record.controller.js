(function() {
    'use strict';

    angular.module('chaise.record')

    .controller('RecordController', ['$window', '$rootScope', function RecordController($window, $rootScope) {
        var vm = this;

        vm.modifyRecord = chaiseConfig.editRecord === false ? false : true;

        vm.createRecord = function() {
            var parts = $rootScope.reference.location.compactPath.split('/');
            // Should I substring based on the position of id or should I split on '/' and piece back together parts 0,1?
            $window.location.href = "../recordedit/#" + $rootScope.reference.location.catalog + '/' + parts[0];
        };

        vm.editRecord = function() {
            $window.location.href = "../recordedit/#" + $rootScope.reference.location.catalog + '/' + $rootScope.reference.location.compactPath;
        };

        vm.permalink = function getPermalink() {
            if (!$rootScope.reference) {
                return $window.location.href;
            }
            return $rootScope.context.mainURI;
        };

        vm.toRecordSet = function(ref) {
            var refLocation = ref.location,
                // This uses $window location because we need the origin and pathname relative to chaise,
                // whereas refLocation gives you that info but relative to ermrestJS
                recordsetPathname = $window.location.pathname.replace("record", "recordset");

            var uri = $window.location.origin + recordsetPathname + '#' + refLocation.catalog + '/' + refLocation.path;
            $window.location.href = uri;
        };
    }]);
})();
