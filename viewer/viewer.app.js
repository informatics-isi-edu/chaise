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
        'angular-markdown-editor'
    ])

    .config(['$compileProvider', '$cookiesProvider', '$logProvider', '$provide', '$uibTooltipProvider', 'ConfigUtilsProvider', function($compileProvider, $cookiesProvider, $logProvider, $provide, $uibTooltipProvider, ConfigUtilsProvider) {
        ConfigUtilsProvider.$get().configureAngular($compileProvider, $cookiesProvider, $logProvider, $uibTooltipProvider);

        $provide.decorator('$templateRequest', ['ConfigUtils', 'UriUtils', '$delegate', function (ConfigUtils, UriUtils, $delegate) {
            return ConfigUtils.decorateTemplateRequest($delegate, UriUtils.chaiseDeploymentPath());
        }]);
    }])

    // TODO this should be removed, viewer shouldn't parse the url
    // Configure the context info from the URI
    .config(['context', 'UriUtilsProvider', function configureContext(context, UriUtilsProvider) {
        var utils = UriUtilsProvider.$get();

        // Parse the URL
        utils.setOrigin();
        utils.parseURLFragment(window.location, context);

        // console.log('Context', context);
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

            // console.log('User: ', user);
            return;
        }, function error(response) {
            throw response;
        });
    }])

    // Hydrate values providers and set up iframe
    .run([
        'ConfigUtils', 'ERMrest', 'Errors', 'DataUtils', 'FunctionUtils', 'headInjector', 'UriUtils', 'logService', '$window', 'context', 'image', '$rootScope', 'Session', 'AlertsService', 'viewerConfig', 'viewerConstant', 'UiUtils', '$timeout', 'viewerAppUtils',
        function runApp(ConfigUtils, ERMrest, Errors, DataUtils, FunctionUtils, headInjector, UriUtils, logService, $window, context, image, $rootScope, Session, AlertsService, viewerConfig, viewerConstant, UiUtils, $timeout, viewerAppUtils) {

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
        var imageURI, svgURIs = [], imageTuple;
        var config = ConfigUtils.getContextJSON();
        var imageConfig = viewerConfig.getImageConfig();
        var osdConstant = viewerConstant.osdViewer;

        // TODO are these needed?
        context.server = config.server;
        context.wid = config.contextHeaderParams.wid;
        context.cid = config.contextHeaderParams.cid;
        context.pid = config.contextHeaderParams.pid;
        context.chaiseBaseURL = UriUtils.chaiseBaseURL();
        UriUtils.setOrigin();

        // NOTE: we're not decoding query parameters because it will mess with the encoding of url values
        var res = UriUtils.chaiseURItoErmrestURI($window.location, true, true);
        var ermrestUri = res.ermrestUri,
            pcid = res.cid,
            ppid = res.pid,
            isQueryParameter = res.isQueryParameter,
            pageQueryParamsString = res.pageQueryParamsString,
            pageQueryParams = res.queryParams;

        context.catalogID = res.catalogId;

        context.queryParams = pageQueryParams;

        FunctionUtils.registerErmrestCallbacks();

        var session,
            headTitleDisplayname, // used for generating the and head title
            hasAnnotationQueryParam = false, // if there are svgs in query param, we should just use it and shouldn't get it from db.
            noImageData = false; // if the main image request didnt return any rows

        // if there are any svg files in the query params, ignore the annotation table.
        // (added here because we want to hide the sidebar as soon as we can)
        if (viewerAppUtils.hasURLQueryParam(pageQueryParams, true)) {
            $rootScope.hideAnnotationSidebar = false;
            $rootScope.loadingAnnotations = true;
            hasAnnotationQueryParam = true;
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

                $rootScope.reference = imageReference;

                $rootScope.logStackPath = logService.logStackPaths.ENTITY;
                $rootScope.logStack = [
                    logService.getStackNode(
                        logService.logStackTypes.ENTITY,
                        imageReference.table,
                        imageReference.filterLogInfo
                    )
                ];
                $rootScope.logAppMode = null;

                var logObj = {
                    action: logService.getActionString(logService.logActions.LOAD),
                    stack: logService.getStackObject()
                };
                if (pcid) logObj.pcid = pcid;
                if (ppid) logObj.ppid = ppid;
                if (isQueryParameter) logObj.cqp = 1;
                return imageReference.contextualize.detailed.read(1, logObj, false, true);
            })
            // read the main (image) reference
            .then(function (imagePage) {

                var tableDisplayName = imagePage.reference.displayname.value;

                if (imagePage.length > 1) {
                    recordSetLink = imagePage.reference.contextualize.compact.appLink;
                    throw new Errors.multipleRecordError(tableDisplayName, recordSetLink);
                }

                if (imagePage.length == 1) {
                    imageTuple = imagePage.tuples[0];
                    image.entity = imageTuple.data;
                    context.imageID = image.entity.RID;
                    imageURI = image.entity[imageConfig.legacy_osd_url_column_name];

                    if (!imageURI) {
                        console.log("The " + imageConfig.legacy_osd_url_column_name + " value is empty in Image table.");
                    }

                    // TODO this feels hacky
                    // get the default zindex value
                    if (imageConfig.default_z_index_column_name in image.entity) {
                        context.defaultZIndex = image.entity[imageConfig.default_z_index_column_name];
                    }

                    /**
                     * page title logic:
                     * - if iframe, don't show it.
                     * - otherwise, compute the markdown_pattern in constant, if it didn't work, use the tuple.rowName.
                     *   if there wasn't any links in the computed value, add a link to the row.
                     *
                     * head title link:
                     *  - if iframe, not applicable.
                     *  - otherwise, compute the markdown_pattern in constant, if it didn't work, use the tuple.displayname.
                     */
                    if ($window.self == $window.parent) {
                        // page title:

                        // get it from the constant
                        var pageTitleCaption = ERMrest.processMarkdownPattern(
                            imageConfig.page_title_markdown_pattern,
                            imageTuple.data,
                            imageReference.table,
                            "detailed",
                            {templateEngine: "handlebars"}
                        );
                        // use the tuple rowName
                        if (pageTitleCaption.value == "" || pageTitleCaption.value == null) {
                            pageTitleCaption = imageTuple.rowName;
                        }

                        //attach link if it doesn't have any
                        if (!pageTitleCaption.isHTML || !pageTitleCaption.value.match(/<a\b.+href=/)) {
                            $rootScope.pageTitle = '<a href="' + imageTuple.reference.contextualize.detailed.appLink + '">' + pageTitleCaption.value + '</a>';
                        } else {
                            $rootScope.pageTitle = pageTitleCaption.value;
                        }

                        // head title:

                        // get it from the constant
                        headTitleDisplayname = ERMrest.processMarkdownPattern(
                            imageConfig.head_title_markdown_pattern,
                            imageTuple.data,
                            imageReference.table,
                            "detailed",
                            {templateEngine: "handlebars"}
                        );
                        // use the tuple rowName
                        if (headTitleDisplayname.value == "" || headTitleDisplayname.value == null) {
                            headTitleDisplayname = imageTuple.displayname;
                        }
                    }

                } else {
                    noImageData = true;
                    $rootScope.pageTitle = "Image";
                }

                // if missing, use 0 instead
                if (context.defaultZIndex == null) {
                    context.defaultZIndex = 0;
                }

                // properly merge the query parameter and ImageURI
                var res = viewerAppUtils.initializeOSDParams(pageQueryParams, imageURI);

                $rootScope.osdViewerParameters = res.osdViewerParams;

                // fetch the missing parameters from database
                if (imageTuple) {
                    // add meterScaleInPixels query param if missing
                    var val = parseFloat(imageTuple.data[imageConfig.pixel_per_meter_column_name]);
                    var qParamName = osdConstant.PIXEL_PER_METER_QPARAM;
                    if (!(qParamName in $rootScope.osdViewerParameters) && !isNaN(val)) {
                        $rootScope.osdViewerParameters[qParamName] = val;
                    }

                    // add waterMark query param if missing
                    var watermark = null;
                    if (DataUtils.isNoneEmptyString(imageConfig.watermark_column_name)) {
                        // get it from the vis columns
                        watermark = imageTuple.data[imageConfig.watermark_column_name]
                    } else if (DataUtils.isNoneEmptyString(imageConfig.watermark_foreign_key_visible_column_name)) {
                        // get it from foreign key relationship
                        val = imageTuple.linkedData[imageConfig.watermark_foreign_key_visible_column_name];
                        if (DataUtils.isObjectAndNotNull(val)) {
                            watermark = val[imageConfig.watermark_foreign_key_data_column_name];
                        }
                    }
                }

                qParamName = osdConstant.WATERMARK_QPARAM;
                if (!(qParamName in $rootScope.osdViewerParameters) && DataUtils.isNoneEmptyString(watermark)) {
                    $rootScope.osdViewerParameters[qParamName] = watermark;
                }

                // if channel info was avaibale on queryParams or imageURI, don't fetch it from DB.
                if (noImageData || !res.loadImageMetadata) {
                    return [];
                }

                return viewerAppUtils.loadImageMetadata();
            }).then(function () {
                // dont fetch annotation from db if:
                // - we have annotation query params
                // - or main image request didn't return any rows
                if (hasAnnotationQueryParam || noImageData) {
                    return false;
                }

                // read the annotation reference
                return viewerAppUtils.readAllAnnotations();
            }).then(function () {

                // view <table displayname>: tuple displayname
                var headTitle = "View " + DataUtils.getDisplaynameInnerText($rootScope.reference.displayname);
                if (headTitleDisplayname) {
                    headTitle += ": " + DataUtils.getDisplaynameInnerText(headTitleDisplayname);
                }
                headInjector.updateHeadTitle(headTitle);

                // disable the annotaiton sidebar:
                //  - if there are no annotation and we cannot create
                //  - the image type doesn't support annotation.
                if ($rootScope.annotationTuples.length == 0 && !$rootScope.canCreate && !hasAnnotationQueryParam) {
                    $rootScope.disableAnnotationSidebar = true;
                }

                if ($rootScope.annotationTuples.length > 0) {
                    $rootScope.loadingAnnotations = true;
                }

                if (!DataUtils.isObjectAndNotNull($rootScope.osdViewerParameters) || $rootScope.osdViewerParameters.mainImage.info.length === 0) {
                    console.log("there wasn't any parameters that we could send to OSD viewer");
                    // TODO better error
                    throw new ERMrest.MalformedURIError("Image information is missing.");
                }

                var osdViewerURI = origin + UriUtils.OSDViewerDeploymentPath() + "mview.html";
                iframe.location.replace(osdViewerURI);

                // NOTE if we move displayReady and displayIframe to be after the osdLoaded,
                //      the scalebar value doesn't properly display. the viewport must be visible
                //      before initializing the osd viewer (and its scalebar)
                // show the page while the image info will be loaded by osd viewer
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
