(function() {
    'use strict';

    angular.module('chaise.config', ['ermrestjs'])

    .run(['ConfigUtils', 'ERMrest', 'UriUtils', '$rootScope', '$window', function(ConfigUtils, ERMrest, UriUtils, $rootScope, $window) {
        // initialize dcctx object
        $window.dcctx = {}
        // set chaise configuration based on what is in `chaise-config.js` first
        ConfigUtils.setConfigJSON();

        ERMrest.onload().then(function () {
            var cc = ConfigUtils.getConfigJSON(),
                service = cc.ermrestLocation,
                // Get the catalog id and strip off the version
                catalogId = UriUtils.getCatalogId().split('@')[0];

            if (catalogId) {
                ERMrest.ermrestFactory.getServer(service).catalogs.get(catalogId).then(function (response) {
                    ConfigUtils.setConfigJSON(response.chaiseConfig);

                    $rootScope.$emit("configuration-done");
                });
                // no need to add a catch block here, errors has been includedso handleException has been configured to be the default handler
            } else {
                // there's no catalog to fetch (may be an index page)
                $rootScope.$emit("configuration-done");
            }
        });
    }])

})();
