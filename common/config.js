(function() {
    'use strict';

    angular.module('chaise.config', ['ermrestjs'])

    .run(['ConfigUtils', 'ERMrest', 'UriUtils', '$rootScope', '$window', function(ConfigUtils, ERMrest, UriUtils, $rootScope, $window) {
        // This needs to be done in case an error occurs and the JS code outside of the angualr scope in errors.js triggers
        $window.dcctx = {
            chaiseConfig: chaiseConfig
        }

        ERMrest.onload().then(function () {
            var urlParts = UriUtils.extractParts($window.location);
            ERMrest.ermrestFactory.getServer(urlParts.service).catalogs.get(urlParts.catalogId).then(function (response) {
                ConfigUtils.setConfigJSON(response.chaiseConfig);

                $rootScope.$emit("configuration-done");
            });
        });
    }])

})();
