(function() {
    'use strict';

    angular.module('chaise.record')

    .controller('RecordController', ['$window', '$rootScope', function RecordController($window, $rootScope) {
        var vm = this;

        vm.modifyRecord = chaiseConfig.editRecord === false ? false : true;

        vm.createRecord = function() {
            try {
                var newRef = $rootScope.reference.contextualize.entryCreate;
                var appURL = newRef.appLink;
                if (!appURL) {
                    throw new Error("Application Error: app linking undefined for " + newRef.compactPath);
                }

                $window.location.href = appURL;
            } catch (error) {
                ErrorService.errorPopup(error.message, error.code, "home page");
            }
        };

        vm.editRecord = function() {
            try {
                var newRef = $rootScope.reference.contextualize.entryEdit;
                var appURL = newRef.appLink;
                if (!appURL) {
                    throw new Error("Application Error: app linking undefined for " + newRef.compactPath);
                }

                $window.location.href = appURL;
            } catch (error) {
                ErrorService.errorPopup(error.message, error.code, "home page");
            }
        };

        vm.permalink = function getPermalink() {
            if (!$rootScope.reference) {
                return $window.location.href;
            }
            return $rootScope.context.mainURI;
        };

        vm.toRecordSet = function(ref) {
            try {
                var appURL = ref.appLink;
                if (!appURL) {
                    throw new Error("Application Error: app linking undefined for " + ref.compactPath);
                }

                $window.location.href = appURL;
            } catch (error) {
                ErrorService.errorPopup(error.message, error.code, "home page");
            }
        };
    }]);
})();
