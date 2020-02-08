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

        // trick to verify if this config app is running inside of an iframe as part of another app
        var inIframe = $window.self !== $window.parent;

        var hideNavbarParam;
        var navbarParam = UriUtils.getQueryParam($window.location.href, "hideNavbar");
        if (navbarParam === "true") {
            hideNavbarParam = true;
        } else if (navbarParam === "false") {
            // matters for when we are inside an iframe
            hideNavbarParam = false;
        } else {
            hideNavbarParam = null;
        }
        /**
         * first case: in iframe and hideNavbar = !false
         *      - could be true or null, null meaning use default of hide navbar in iframe
         * second case: hideNavbar = true
         *      - doesn't matter if in an iframe or not, if true, hide it
         */
        var hideNavbar = (inIframe && hideNavbarParam !== false) || hideNavbarParam === true;
        var metatag = document.head.querySelector("[name~=version][content]");
        var version = metatag ? metatag.content : null;

        // initialize dcctx object
        $window.dcctx = {
            contextHeaderParams: {
                cid: appName,
                pid: MathUtils.uuid(),
                wid: $window.name
            },
            hideNavbar: hideNavbar,
            version: version
        };
        // set chaise configuration based on what is in `chaise-config.js` first
        ConfigUtils.setConfigJSON();

        ERMrest.onload().then(function () {
            var cc = ConfigUtils.getConfigJSON(),
                service = cc.ermrestLocation,
                catalogId = UriUtils.getCatalogId();

            if (catalogId) {
                // the server object that can be used in other places
                $window.dcctx.server = ERMrest.ermrestFactory.getServer(service, $window.dcctx.contextHeaderParams);

                $window.dcctx.server.catalogs.get(catalogId).then(function (response) {
                    // we already setup the defaults and the configuration based on chaise-config.js
                    if (response.chaiseConfig) ConfigUtils.setConfigJSON(response.chaiseConfig);

                    return headInjector.setupHead();
                }).then(function () {
                    $rootScope.$emit("configuration-done");
                })
                // no need to add a catch block here, errors has been includedso handleException has been configured to be the default handler
            } else {
                // there's no catalog to fetch (may be an index page)
                headInjector.setupHead().then(function () {
                    $rootScope.$emit("configuration-done");
                });
            }
        });
    }])

})();
