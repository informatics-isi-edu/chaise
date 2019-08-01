(function() {
    'use strict';

    /**
     * Module Dependencies:
     *    |--ermrestJS
     *    |
     *    |--utils.js
     *       |--errors.js - needed for utils
     *       |  |--alerts.js
     *       |  |  |--filters.js
     *       |  |
     *       |  |--authen.js
     *       |  |  |--storage.js
     *       |  |
     *       |  |--modal.js
     *       |
     *       |--inputs.js
     *          |--validators.js
     */
    angular.module('chaise.config', [
        'chaise.utils',
        'ermrestjs',
        'ngCookies',
        'ui.bootstrap'
    ])

    .run(['appName', 'ConfigUtils', 'ERMrest', 'headInjector', 'MathUtils', 'UriUtils', '$rootScope', '$window', function(appName, ConfigUtils, ERMrest, headInjector, MathUtils, UriUtils, $rootScope, $window) {
        headInjector.setWindowName();

        // we don't care if the param is any other value than true
        var hideNavbar = UriUtils.getQueryParam($window.location.href, "hideNavbar") === "true";
        // initialize dcctx object
        $window.dcctx = {
            cid: appName,
            pid: MathUtils.uuid(),
            wid: $window.name,
            hideNavbar: hideNavbar
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

                    headInjector.setupHead();
                    $rootScope.$emit("configuration-done");
                });
                // no need to add a catch block here, errors has been includedso handleException has been configured to be the default handler
            } else {
                // there's no catalog to fetch (may be an index page)
                headInjector.setupHead();
                $rootScope.$emit("configuration-done");
            }
        });
    }])

})();
