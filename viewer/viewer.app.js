(function() {
    'use strict';

    angular.module('chaise.configure-viewer', ['chaise.config'])

    .constant('appName', 'viewer')

    .run(['$rootScope', function ($rootScope) {
        // When the configuration module's run block emits the `configuration-done` event, attach the app to the DOM
        $rootScope.$on("configuration-done", function () {

            angular.element(document).ready(function(){
                angular.bootstrap(document.getElementById("viewer"), ["chaise.viewer"]);
            });
        });
    }]);

    var client;

    angular.module('chaise.viewer', [
        'ngSanitize',
        'ngCookies',
        'ngAnimate',
        'duScroll',
        'chaise.alerts',
        'chaise.authen',
        'chaise.errors',
        'chaise.faceting',
        'chaise.filters',
        'chaise.inputs',
        'chaise.delete',
        'chaise.modal',
        'chaise.navbar',
        'chaise.upload',
        'chaise.record.table',
        'chaise.recordcreate',
        'chaise.resizable',
        'chaise.utils',
        'ermrestjs',
        'ngCookies',
        'ngSanitize',
        'ngMessages',
        'ui.mask',
        'ui.select',
        'ui.bootstrap',
        'ng.deviceDetector',
        'angular-markdown-editor'
    ])

    .config(['$compileProvider', '$cookiesProvider', '$logProvider', '$provide', '$uibTooltipProvider', 'ConfigUtilsProvider', function($compileProvider, $cookiesProvider, $logProvider, $provide, $uibTooltipProvider, ConfigUtilsProvider) {
        ConfigUtilsProvider.$get().configureAngular($compileProvider, $cookiesProvider, $logProvider, $uibTooltipProvider);

        $provide.decorator('$templateRequest', ['ConfigUtils', 'UriUtils', '$delegate', function (ConfigUtils, UriUtils, $delegate) {
            return ConfigUtils.decorateTemplateRequest($delegate, UriUtils.chaiseDeploymentPath());
        }]);
    }])

    // Configure the context info from the URI
    .config(['context', 'UriUtilsProvider', function configureContext(context, UriUtilsProvider) {
        var utils = UriUtilsProvider.$get();

        // Parse the URL
        utils.setOrigin();
        utils.parseURLFragment(window.location, context);

        // TODO this should be removed, viewer shouldn't parse the url
        console.log('Context', context);
    }])

    // Configure all tooltips to be attached to the body by default. To attach a
    // tooltip on the element instead, set the `tooltip-append-to-body` attribute
    // to `false` on the element.
    .config(['$uibTooltipProvider', function($uibTooltipProvider) {
        $uibTooltipProvider.options({appendToBody: true});
    }])

    // TODO not used anymore and can be removed (it was used by old annotation support code)
    .config(['userProvider', 'context', 'SessionProvider', 'ConfigUtilsProvider', function configureUser(userProvider, context, SessionProvider, ConfigUtilsProvider) {
        var chaiseConfig = ConfigUtilsProvider.$get().getConfigJSON();
        SessionProvider.$get().getSession().then(function success(session) {
            // there's no active session
            if (!session) return;

            var groups = chaiseConfig.userGroups || context.groups;
            // session.attributes is an array of objects that have a display_name and id
            // We MUST use the id field to check for role inclusion as it is the unique identifier
            var attributes = session.attributes.map(function(attribute) { return attribute.id });
            var user = userProvider.$get();
            user.session = session;

// TODO Let's try to extract this setup to unclutter *.app.js
            // Need to check if using the new web authen
            // if so, there will be a client object with a combination of any or all of the following: display_name, full_name, and email
            // first priority id display_name
            if (session.client.display_name) {
                user.name = session.client.display_name;
            // full_name is second priority
            } else if (session.client.full_name) {
                user.name = session.client.full_name;
            // fallback if no display_name or full_name
            } else if (session.client.email) {
                user.name = session.client.email;
            // Case for old web authen where client is a string
            } else {
                user.name = session.client
            }

            if (attributes.indexOf(groups.curators) > -1) {
                user.role = 'curator';
            } else if (attributes.indexOf(groups.annotators) > -1) {
                user.role = 'annotator';
            } else if (attributes.indexOf(groups.users) > -1) {
                user.role = 'user';
            } else {
                user.role = null;
            }

            console.log('User: ', user);
            return;
        }, function error(response) {
            throw response;
        });
    }])

    // Hydrate values providers and set up iframe
    .run([
        'ConfigUtils', 'ERMrest', 'Errors', 'DataUtils', 'FunctionUtils', 'UriUtils', 'logService', '$window', 'context', 'image', '$rootScope', 'Session', 'AlertsService', 'viewerConstant', 'UiUtils', '$timeout', 'viewerAppUtils',
        function runApp(ConfigUtils, ERMrest, Errors, DataUtils, FunctionUtils, UriUtils, logService, $window, context, image, $rootScope, Session, AlertsService, viewerConstant, UiUtils, $timeout, viewerAppUtils) {

        var origin = $window.location.origin;
        var iframe = $window.frames[0];
        $rootScope.displayReady = false;
        $rootScope.displayIframe = false;

        // only show the panel if there are annotation images in the url
        $rootScope.hideAnnotationSidebar = true;
        $rootScope.annotationTuples = [];

        var arrows = [];
        var rectangles = [];
        var sections = [];

        var iframe = $window.frames[0];
        var arrows = [];
        var rectangles = [];
        var sections = [];
        var session;
        var imageURI, svgURIs = [];
        var config = ConfigUtils.getContextJSON();
        var annotConstant = viewerConstant.annotation;
        var imageConstant = viewerConstant.image;

        context.server = config.server;
        context.wid = config.contextHeaderParams.wid;
        context.cid = config.contextHeaderParams.cid;
        context.pid = config.contextHeaderParams.pid;
        context.chaiseBaseURL = UriUtils.chaiseBaseURL();
        UriUtils.setOrigin();

        var res = UriUtils.chaiseURItoErmrestURI($window.location, true);
        var ermrestUri = res.ermrestUri,
            pcid = config.contextHeaderParams.cid,
            ppid = config.contextHeaderParams.pid,
            isQueryParameter = res.isQueryParameter,
            queryParamsString = res.queryParamsString,
            queryParams = res.queryParams;

        context.catalogID = res.catalogId;

        context.queryParams = res.queryParams;

        FunctionUtils.registerErmrestCallbacks();

        var session, annotationEditReference;
        var osdViewerQueryParams = queryParamsString, // what will be passed onto osd viewer
            hasAnnotationQueryParam = false, // if there are svgs in query param, we should just use it and shouldn't get it from db.
            hasImageQueryParam = false, // if there is an image in query, we should just use it and shouldn't use the image uri from db
            osdCanShowAnnotation = false; // whether we can show image annotations or not (if not, we will disable the sidebar)

        // HACK: this is just a hack to allow quick testing
        // if there are any svg files in the query params, ignore the annotation table.
        // we cannot use the queryParams object that is returned since it only give us the last url
        // (it's a key-value so it's not supporting duplicated key values)
        // NOTE we're using the same logic as osd viewer, if that one changed, we should this as well
        if (queryParamsString && queryParamsString.length > 0) {
            queryParamsString.split('&').forEach(function (queryStr) {
                var qpart = queryStr.split("=");
                if (qpart.length != 2 || qpart[0] !== "url") return;

                if (qpart[1].indexOf(".svg") != -1 || qpart[1].indexOf(annotConstant.OVERLAY_HATRAC_PATH) != -1) {
                    $rootScope.hideAnnotationSidebar = false;
                    $rootScope.loadingAnnotations = true;
                    hasAnnotationQueryParam = true;
                } else {
                    hasImageQueryParam = true;
                }
            });
        }

        // Subscribe to on change event for session
        var subId = Session.subscribeOnChange(function () {
            // Unsubscribe onchange event to avoid this function getting called again
            Session.unsubscribeOnChange(subId);

            var imageReference;
            // resolve the main (image) reference
            ERMrest.resolve(ermrestUri, ConfigUtils.getContextHeaderParams()).then(function (ref) {
                imageReference = ref;

                // TODO check for filter
                // context.filter = imageReference.location.filter;
                // context.facets = imageReference.location.facets;
                // DataUtils.verify((context.filter || context.facets), 'No filter or facet was defined. Cannot find a record without a filter or facet.');

                session = Session.getSessionValue();
                if (!session && Session.showPreviousSessionAlert()) AlertsService.addAlert(messageMap.previousSession.message, 'warning', Session.createPromptExpirationToken);

                // TODO is it needed?
                $rootScope.session = session;

                var logObj = {};
                if (pcid) logObj.pcid = pcid;
                if (ppid) logObj.ppid = ppid;
                if (isQueryParameter) logObj.cqp = 1;

                $rootScope.logStackPath = logService.logStackPaths.ENTITY;
                $rootScope.logStack = [
                    logService.getStackNode(
                        logService.logStackTypes.ENTITY,
                        imageReference.table,
                        imageReference.filterLogInfo
                    )
                ];

                return imageReference.contextualize.detailed.read(1, logObj, true, true);
            })
            // read the main (image) reference
            .then(function (imagePage) {

                // TODO throw error
                // what if the record doesn't exist (or there are multiple)
                if (imagePage.length != 1) {
                    console.log("Image request didn't return a row.");
                    return false;
                }

                image.entity = imagePage.tuples[0].data;
                context.imageID = image.entity.RID;
                imageURI = image.entity[imageConstant.URI_COLUMN_NAME];

                // TODO some sort of warning maybe?
                if (!imageURI) {
                    console.log("The " + imageConstant.URI_COLUMN_NAME + " value is empty. We cannot show any image from database.");
                }

                // TODO this feels hacky
                // get the default zindex value
                if (imageConstant.DEFAULT_Z_INDEX_COLUMN_NAME in image.entity) {
                    context.defaultZIndex = image.entity[imageConstant.DEFAULT_Z_INDEX_COLUMN_NAME];
                }

                /**
                * - if url is passed in query parameters, don't use image.uri value
                *   (TODO maybe we shouldn't even read the image? (we're reading image for RID value etc..)
                * - otherwise, if image.uri value exists
                *    - and has query parameter, use the image.uri query parameter.
                *    - otherwise, use the image.uri value
                */
                if(!hasImageQueryParam && (typeof imageURI === "string")){
                    osdViewerQueryParams += (osdViewerQueryParams.length > 0 ?  "&" : "");
                    if (imageURI.indexOf("?") !== -1) {
                        osdViewerQueryParams += imageURI.split("?")[1];
                    } else {
                        osdViewerQueryParams += imageURI;
                    }
                }

                // TODO throw an error if there wasn't any image

                osdCanShowAnnotation = viewerAppUtils.canOSDShowAnnotation(osdViewerQueryParams);

                // if there's svg query param, don't fetch the annotations from DB.
                // if we cannot show any overlay, there's no point in reading
                if (hasAnnotationQueryParam || !osdCanShowAnnotation) {
                    return false;
                }

                return viewerAppUtils.readAllAnnotations();
            })
            // read the annotation reference
            .then(function (res) {
                // disable the annotaiton sidebar:
                //  - if there are no annotation and we cannot create
                //  - the image type doesn't support annotation.
                if ($rootScope.annotationTuples.length == 0 && !$rootScope.canCreate && !hasAnnotationQueryParam) {
                    $rootScope.disableAnnotationSidebar = true;
                }

                if ($rootScope.annotationTuples.length > 0) {
                    $rootScope.loadingAnnotations = true;
                }

                var osdViewerURI = origin + UriUtils.OSDViewerDeploymentPath() + "mview.html?" + osdViewerQueryParams;
                console.log('osd viewer location: ', osdViewerURI);
                iframe.location.replace(osdViewerURI);

                // TODO there should be a way that osd tells us it's done doing it's setup.
                $rootScope.displayReady = true;

                /**
                 * fix the size of main-container and sticky areas, and then show the iframe.
                 * these have to be done in a digest cycle after setting the displayReady.
                 * Because this way, we will ensure to run the height logic after the page
                 * content is visible and therefore it can set a correct height for the bottom-container.
                 * otherwise the iframe will be displayed in a small box first.
                 */
                $timeout(function () {
                    UiUtils.attachContainerHeightSensors();
                    $rootScope.displayIframe = true;
                });

            }).catch(function (err) {
                // TODO errors.js is not showing the errors coming from viewer,
                // so if we decided to show errors from this app, we should change that one as well.
                throw err;
            });
        });

        /**
         * it saves the location in $rootScope.location.
         * When address bar is changed, this code compares the address bar location
         * with the last save recordset location. If it's the same, the change of url was
         * done internally, do not refresh page. If not, the change was done manually
         * outside recordset, refresh page.
         *
         */
        UriUtils.setLocationChangeHandling();

        // This is to allow the dropdown button to open at the top/bottom depending on the space available
        UiUtils.setBootstrapDropdownButtonBehavior();
    }]);
})();
