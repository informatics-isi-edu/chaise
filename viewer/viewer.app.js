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
    .run(['ConfigUtils', 'ERMrest', 'Errors', 'DataUtils', 'FunctionUtils', 'UriUtils', 'InputUtils', 'logService', '$window', 'context', 'image', 'annotations', 'MathUtils', '$rootScope', 'Session', 'annotationCreateForm', 'annotationEditForm', 'recordCreate', 'AlertsService', 'viewerConstant',
        function runApp(ConfigUtils, ERMrest, Errors, DataUtils, FunctionUtils, UriUtils, InputUtils, logService, $window, context, image, annotations, MathUtils, $rootScope, Session, annotationCreateForm, annotationEditForm, recordCreate, AlertsService, viewerConstant) {
        var origin = $window.location.origin;
        var iframe = $window.frames[0];
        $rootScope.displayReady = false;

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
                // TODO what if the record doesn't exist (or there are multiple)
                if (imagePage.length > 0) {
                    image.entity = imagePage.tuples[0].data;
                }

                context.imageID = image.entity.RID;

                if (image.entity) {
                    imageURI = image.entity[imageConstant.URI_COLUMN];
                }

                // TODO should be done in ermrestjs
                var imageAnnotationURL = context.serviceURL + "/catalog/" + context.catalogID + "/entity/";
                imageAnnotationURL += UriUtils.fixedEncodeURIComponent(annotConstant.ANNOTATION_TABLE_SCHEMA_NAME) + ":";
                imageAnnotationURL += UriUtils.fixedEncodeURIComponent(annotConstant.ANNOTATION_TABLE_NAME) + "/";
                imageAnnotationURL += UriUtils.fixedEncodeURIComponent(annotConstant.REFERENCE_IMAGE_COLUMN_NAME);
                imageAnnotationURL += "=" + UriUtils.fixedEncodeURIComponent(context.imageID);
                return ERMrest.resolve(imageAnnotationURL, { cid: context.cid, pid: context.pid, wid: context.wid });
            })
            // create the annotation reference
            .then(function (ref) {

                annotationEditReference = ref.contextualize.entryEdit;

                $rootScope.canCreate = annotationEditReference.canCreate || false;
                $rootScope.canUpdate = annotationEditReference.canUpdate || false;
                $rootScope.canDelete = annotationEditReference.canDelete || false;

                annotationEditReference.session = session;
                $rootScope.session = session;

                // TODO create and edit should be refactored to reuse the same code
                // create the edit and create forms
                var invisibleColumns = [
                    annotConstant.OVERLAY_COLUMN_NAME,
                    annotConstant.REFERENCE_IMAGE_VISIBLE_COLUMN_NAME,
                    annotConstant.Z_INDEX_COLUMN_NAME,
                    annotConstant.CHANNELS_COLUMN_NAME
                ];
                if ($rootScope.canCreate) {
                    annotationCreateForm.reference = ref.contextualize.entryCreate;
                    annotationCreateForm.reference.columns.forEach(function (column) {
                        // remove the invisible (asset, image, z-index, channels) columns
                        if (invisibleColumns.indexOf(column.name) !== -1) return;

                        annotationCreateForm.columnModels.push(recordCreate.columnToColumnModel(column));
                    });
                }

                if ($rootScope.canUpdate) {
                    annotationEditForm.reference = annotationEditReference;
                    annotationEditForm.reference.columns.forEach(function (column) {
                        // remove the invisible (asset, image, z-index, channels) columns
                        if (invisibleColumns.indexOf(column.name) !== -1) return;

                        annotationEditForm.columnModels.push(recordCreate.columnToColumnModel(column));
                    });
                }

                // TODO needs to be updated
                var logObj = {
                    action: logService.getActionString(logService.logActions.VIEWER_ANNOT_LOAD),
                    stack: logService.getStackObject()
                };

                // TODO how many should we read?
                // using edit, because the tuples are used in edit context (for populating edit form)
                return annotationEditReference.read(201, logObj);
            })
            // read the annotation reference
            .then(function getPage(page) {
                // TODO not used
                $rootScope.showColumnSpinner = [{}];

                $rootScope.annotationTuples = page.tuples;

                for(var j = 0; j < page.tuples.length; j++){
                    var row = page.tuples[j].data;
                    if(row && row[annotConstant.OVERLAY_COLUMN_NAME]){
                        svgURIs.push(row[annotConstant.OVERLAY_COLUMN_NAME]);
                    }
                }

                // Load the openseadragon after we got the corresponding svg files
                var osdViewerLocation =  origin + UriUtils.OSDViewerDeploymentPath() + "mview.html";
                var osdViewerQueryParams = queryParamsString;

                /**
                 * - if url is passed in query parameters, don't use image.uri value
                 * - otherwise, if image.uri value exists
                 *    - and has query parameter, use the image.uri query parameter.
                 *    - otherwise, use the image.uri value
                 */
                if(!("url" in queryParams) && (typeof imageURI === "string")){
                    osdViewerQueryParams += (osdViewerQueryParams.length > 0 ?  "&" : "");
                    if (imageURI.indexOf("?") !== -1) {
                        osdViewerQueryParams += imageURI.split("?")[1];
                    } else {
                        osdViewerQueryParams += imageURI;
                    }
                }

                // attach the svg locations
                for (var i = 0; i < svgURIs.length; i++){
                    osdViewerQueryParams += (osdViewerQueryParams.length > 0 ?  "&" : "");
                    osdViewerQueryParams += "url=" + UriUtils.getAbsoluteURL(svgURIs[i], origin);
                }

                // TODO throw error
                if (osdViewerQueryParams.length === 0) {
                    console.log("there wasn't any appropriate parameters for osd.")
                }

                // TODO what if there are no osdViewerQueryParams
                var osdViewerURI = osdViewerLocation + "?" + osdViewerQueryParams;
                console.log('replace uri = '+ osdViewerURI)
                iframe.location.replace(osdViewerURI);
                console.log('Image: ', image);

                // TODO there should be a way that osd tells us it's done doing it's setup..
                $rootScope.displayReady = true;
            }).catch(function (err) {
                throw err;
            });
        });

        // Initialize Bootstrap tooltips
        $(document).ready(function(){
            $('[data-toggle="tooltip"]').tooltip({
                placement: 'bottom',
                container: 'body',
                html: true
            });
        });
    }]);

    // Refresh the page when the window's hash changes. Needed because Angular
    // normally doesn't refresh page when hash changes.
    window.onhashchange = function() {
        if (window.location.hash != '#undefined') {
            location.reload();
        } else {
            history.replaceState("", document.title, window.location.pathname);
            location.reload();
        }
        function goBack() {
            window.location.hash = window.location.lasthash[window.location.lasthash.length-1];
            window.location.lasthash.pop();
        }
    }
})();
