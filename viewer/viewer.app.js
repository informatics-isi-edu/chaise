(function() {
    'use strict';

    angular.module('chaise.configure-viewer', ['chaise.config'])

    .constant('settings', {
        appName: "viewer",
        appTitle: "Image Viewer",
        overrideHeadTitle: true,
        overrideImagePreviewBehavior: true,
        overrideDownloadClickBehavior: true,
        overrideExternalLinkBehavior: true,
        openIframeLinksInTab: true
    })

    .run(['$rootScope', function ($rootScope) {
        // When the configuration module's run block emits the `configuration-done` event, attach the app to the DOM
        $rootScope.$on("configuration-done", function () {

            angular.element(document).ready(function(){
                angular.bootstrap(document.getElementById("viewer"), ["chaise.viewer"]);
            });
        });
    }]);

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
        'ui.bootstrap',
        'angular-markdown-editor'
    ])

    .config(['$compileProvider', '$cookiesProvider', '$logProvider', '$provide', '$uibTooltipProvider', 'ConfigUtilsProvider', function($compileProvider, $cookiesProvider, $logProvider, $provide, $uibTooltipProvider, ConfigUtilsProvider) {
        ConfigUtilsProvider.$get().configureAngular($compileProvider, $cookiesProvider, $logProvider, $uibTooltipProvider);

        $provide.decorator('$templateRequest', ['ConfigUtils', 'UriUtils', '$delegate', function (ConfigUtils, UriUtils, $delegate) {
            return ConfigUtils.decorateTemplateRequest($delegate, UriUtils.chaiseDeploymentPath());
        }]);
    }])

    // Hydrate values providers and set up iframe
    .run([
        'ConfigUtils', 'ERMrest', 'Errors', 'ErrorService', 'DataUtils', 'FunctionUtils', 'headInjector', 'UriUtils', 'logService', 'messageMap', '$window', 'context', '$rootScope', 'Session', 'AlertsService', 'viewerConfig', 'viewerConstant', 'UiUtils', '$timeout', 'viewerAppUtils',
        function runApp(ConfigUtils, ERMrest, Errors, ErrorService, DataUtils, FunctionUtils, headInjector, UriUtils, logService, messageMap, $window, context, $rootScope, Session, AlertsService, viewerConfig, viewerConstant, UiUtils, $timeout, viewerAppUtils) {

        var origin = $window.location.origin;
        var iframe = $window.frames[0];
        $rootScope.displayReady = false;
        $rootScope.displayIframe = false;

        // only show the panel if there are annotation images in the url
        $rootScope.hideAnnotationSidebar = true;
        $rootScope.annotationTuples = [];

        var iframe = $window.frames[0];
        var session;
        var imageURI, svgURIs = [], imageTuple;
        var imageConfig = viewerConfig.getImageConfig();
        var osdConstant = viewerConstant.osdViewer;

        UriUtils.setOrigin();

        // NOTE: we're not decoding query parameters because it will mess with the encoding of url values
        var res = UriUtils.chaiseURItoErmrestURI($window.location, true, true);
        var ermrestUri = res.ermrestUri,
            pcid = res.pcid,
            ppid = res.ppid,
            isQueryParameter = res.isQueryParameter,
            pageQueryParams = res.queryParams;

        context.catalogID = res.catalogId;

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

            session = Session.getSessionValue();
            ERMrest.setClientSession(session);

            var imageReference;
            // resolve the main (image) reference
            ERMrest.resolve(ermrestUri, ConfigUtils.getContextHeaderParams()).then(function (reference) {
                // TODO added this to get rid of terminal error, but this doesn't make sense to me
                //      we shouldn't polute rootScope in other apps for no reason.
                //      and also this should be based on contextualized reference
                $rootScope.savedQuery = ConfigUtils.initializeSavingQueries(reference, res.queryParams);

                imageReference = reference;

                // TODO check for filter
                // DataUtils.verify((imageReference.location.filter || imageReference.location.facets), 'No filter or facet was defined. Cannot find a record without a filter or facet.');

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

                // since we want to check the ACL for updating the default_Z we have to ask for TCRS
                return imageReference.contextualize.detailed.read(1, logObj, false, true, false, true);
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

                    $rootScope.tuple = imageTuple;

                    context.imageID = imageTuple.data.RID;
                    imageURI = imageTuple.data[imageConfig.legacy_osd_url_column_name];

                    if (!imageURI) {
                        console.log("The " + imageConfig.legacy_osd_url_column_name + " value is empty in Image table.");
                    }

                    // TODO this feels hacky
                    // get the default zindex value
                    if (imageConfig.default_z_index_column_name in imageTuple.data) {
                        context.defaultZIndex = imageTuple.data[imageConfig.default_z_index_column_name];
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

                    // properly set the mainImage acls
                    $rootScope.osdViewerParameters.acls.mainImage = {
                        canUpdateDefaultZIndex: imageTuple.canUpdate && imageTuple.checkPermissions("column_update", imageConfig.default_z_index_column_name)
                    };
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
                return viewerAppUtils.readAllAnnotations(true);
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
                // if ($rootScope.annotationTuples.length == 0 && !$rootScope.canCreateAnnotation && !hasAnnotationQueryParam) {
                //     $rootScope.disableAnnotationSidebar = true;
                // }

                if ($rootScope.annotationTuples.length > 0) {
                    $rootScope.loadingAnnotations = true;
                }

                if (!DataUtils.isObjectAndNotNull($rootScope.osdViewerParameters) || $rootScope.osdViewerParameters.mainImage.info.length === 0) {
                    console.log("there wasn't any parameters that we could send to OSD viewer");
                    // TODO better error
                    throw new ERMrest.MalformedURIError("Image information is missing.");
                }

                /**
                 * Some features are not working properly in safari, so we should let them know
                 *
                 * since the issues are only related to annotaion, we're only showing this error if
                 * there are some annotations, or user can create or edit annotations.
                 */
                var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
                var hasOrCanHaveAnnot = ($rootScope.annotationTuples.length > 0 || $rootScope.canUpdateAnnotation || $rootScope.canCreateAnnotation);
                if (isSafari && hasOrCanHaveAnnot) {
                    var errorMessage = [
                      'You are using a browser that has limited support for this application.',
                      '<br/><br/>',
                      'The following features related to the annotation tool might not work as expected:',
                      '<ul><br/>',
                      '<li style="list-style-type: inherit"><strong>Arrow line</strong>: The arrowheads might not be visible on high-resolution images.</li>',
                      '<li style="list-style-type: inherit"><strong>Text</strong>: The text box cannot be resized during drawing.</li>',
                      '<br/></ul>',
                      'We recommend using <a target="_blank" href="https://www.google.com/chrome/">Google Chrome</a> ',
                      'or <a target="_blank" href="https://www.mozilla.org/en-US/firefox/new/">Mozilla Firefox</a> ',
                      'for full annotation support.'
                    ].join('');

                    var error = new Errors.LimitedBrowserSupport(errorMessage, null, messageMap.clickActionMessage.dismissDialog, true);
                    ErrorService.handleException(error, true);
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
