(function() {
    'use strict';

    angular.module('chaise.record')

    .controller('RecordController', ['$window', '$rootScope', function RecordController($window, $rootScope) {
        var vm = this;

        vm.modifyRecord = chaiseConfig.editRecord === false ? false : true;

        vm.createRecord = function() {
            var appURL = $rootScope.reference.contextualize.entryCreate.appLink;
            if (!appURL) {
                var parts = $rootScope.reference.location.compactPath.split('/');
                // Should I substring based on the position of id or should I split on '/' and piece back together parts 0,1?
                appURL = "../recordedit/#" + $rootScope.reference.location.catalog + '/' + parts[0];
            }

            $window.location.href = appURL;
        };

        vm.editRecord = function() {
            var appURL = $rootScope.reference.contextualize.entryEdit.appLink;
            if (!appURL)
                appURL = "../recordedit/#" + $rootScope.reference.location.catalog + '/' + $rootScope.reference.location.compactPath;

            $window.location.href = appURL;
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
                var refLocation = ref.location,
                // This uses $window location because we need the origin and pathname relative to chaise,
                // whereas refLocation gives you that info but relative to ermrestJS
                recordsetPathname = $window.location.pathname.replace("record", "recordset");

                appURL = $window.location.origin + recordsetPathname + '#' + refLocation.catalog + '/' + refLocation.path;
            }

            $window.location.href = appURL;
        };
    }]);
})();
