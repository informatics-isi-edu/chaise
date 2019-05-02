(function() {
    'use strict';

    angular.module('chaise.config', ['chaise.utils', 'ermrestjs'])

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
                // the server object that can be used in other places
                $window.dcctx.server = ERMrest.ermrestFactory.getServer(service, { cid: $window.dcctx.cid, pid: $window.dcctx.pid, wid: $window.dcctx.wid });

                $window.dcctx.server.catalogs.get(catalogId).then(function (response) {
                    // we already setup the defaults and the configuration based on chaise-config.js
                    if (response.chaiseConfig) ConfigUtils.setConfigJSON(response.chaiseConfig);

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
