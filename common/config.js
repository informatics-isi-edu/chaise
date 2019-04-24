(function() {
    'use strict';

    angular.module('chaise.config', ['ermrestjs'])

    .run(['appName', 'ConfigUtils', 'ERMrest', 'headInjector', 'MathUtils', 'UriUtils', '$rootScope', '$window', function(appName, ConfigUtils, ERMrest, headInjector, MathUtils, UriUtils, $rootScope, $window) {
        headInjector.setWindowName();
        // initialize dcctx object
        $window.dcctx = {
            cid: appName,
            pid: MathUtils.uuid(),
            wid: $window.name
        }
        // set chaise configuration based on what is in `chaise-config.js` first
        ConfigUtils.setConfigJSON();

        ERMrest.onload().then(function () {
            var cc = ConfigUtils.getConfigJSON(),
                service = cc.ermrestLocation,
                catalogId = UriUtils.getCatalogId();

            if (catalogId) {
                ERMrest.ermrestFactory.getServer(service, { cid: dcctx.cid, pid: dcctx.pid, wid: dcctx.wid }).catalogs.get(catalogId).then(function (response) {
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
