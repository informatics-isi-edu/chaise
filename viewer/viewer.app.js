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
        'chaise.markdown',
        'chaise.modal',
        'chaise.navbar',
        'chaise.upload',
        'chaise.record.table',
        'chaise.recordcreate',
        'chaise.utils',
        'ermrestjs',
        'ngCookies',
        'ngSanitize',
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

        // should we allow for improper URLs here?
        // what if there are 2 filters and the id filter is the second one.
        // Is that improper or should it be parsed and ignore the other filter?
        var filter = context.filter.filters[0];
        if (filter.type === "BinaryPredicate" &&
            filter.operator === "=" &&
            filter.column.toLowerCase() === "id") {
            context.imageID = filter.value;
        }

        console.log('Context', context);
        // TODO: Check if context has everything it needs before proceeding. If not, Bad Request
    }])

    // set the chasie-config property
    .config(['headInjectorProvider', function (headInjectorProvider) {

        headInjectorProvider.$get().setupHead();
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
    .run(['ConfigUtils', 'ERMrest', 'Errors', 'DataUtils', 'FunctionUtils', 'UriUtils', 'InputUtils', 'logService', '$window', 'context', 'image', 'annotations', 'MathUtils', 'viewerModel', '$rootScope', 'Session', 'annotationCreateForm', 'annotationEditForm', 'recordCreate', 'AlertsService', 'viewerConstant',
        function runApp(ConfigUtils, ERMrest, Errors, DataUtils, FunctionUtils, UriUtils, InputUtils, logService, $window, context, image, annotations, MathUtils, viewerModel, $rootScope, Session, annotationCreateForm, annotationEditForm, recordCreate, AlertsService, viewerConstant) {
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
        var imageAnnotationURL = context.serviceURL + "/catalog/2/entity/Gene_Expression:Image_Annotation";
        var imageURI, svgURIs = [];
        var config = ConfigUtils.getContextJSON();

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

        // will be used to determine the app mode (edit, create, or copy)
        // We are not passing the query parameters that are used for app mode,
        // so we cannot use the queryParams that parser is returning.
        context.queryParams = res.queryParams;
        context.MAX_ROWS_TO_ADD = 201;

        // modes = create, edit, copy
        // create is contextualized to entry/create
        // edit is contextualized to entry/edit
        // copy is contextualized to entry/create
        // NOTE: copy is technically creating an entity so it needs the proper visible column list as well as the data for the record associated with the given filter
        context.modes = {
            COPY: "copy",
            CREATE: "create",
            EDIT: "edit"
        }
        // mode defaults to create
        context.mode = context.modes.CREATE;

        FunctionUtils.registerErmrestCallbacks();

        var session;

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

                // TODO what should be the context
                return imageReference.contextualize.detailed.read(1, logObj, true, true);
            })
            // read the main (image) reference
            .then(function (imagePage) {
                // TODO what if the record doesn't exist (or there are multiple)
                if (imagePage.length > 0) {
                    image.entity = imagePage.tuples[0].data;
                }

                if (image.entity) {
                    imageURI = image.entity.uri;
                }

                imageAnnotationURL += "/Image=" + context.imageID;
                return ERMrest.resolve(imageAnnotationURL, { cid: context.cid, pid: context.pid, wid: context.wid });
            })
            // create the annotation reference
            .then(function (annotationReference) {

                // we are using filter to determine app mode, the logic for getting filter
                // should be in the parser and we should not duplicate it in here
                // NOTE: we might need to change this line (we're parsing the whole url just for fidinig if there's filter)
                // var location = annotationReference.location;

                // TODO remove anywhere these are used
                // Mode can be any 3 with a filter
                // if (location.filter || location.facets) {
                //     // prefill always means create
                //     // copy means copy regardless of a limit defined
                //     // edit is everything else with a filter
                //     context.mode = (context.queryParams.prefill ? context.modes.CREATE : (context.queryParams.copy ? context.modes.COPY : context.modes.EDIT));
                // } else if (context.queryParams.limit) {
                //     context.mode = context.modes.EDIT;
                // }
                // context.appContext = (context.mode == context.modes.EDIT ? "entry/edit" : "entry/create");


                // get the list of annotations
                // TODO should be removed (currently used in form which is wrong)

                // TODO should use compact context
                // $rootScope.annotationReference = annotationReference.contextualize.compact;
                $rootScope.annotationReference = annotationReference.contextualize.entryCreate;

                $rootScope.canCreate = annotationReference.canCreate || false;
                $rootScope.canUpdate = annotationReference.canUpdate || false;
                $rootScope.canDelete = annotationReference.canDelete || false;

                $rootScope.annotationReference.session = session;
                $rootScope.session = session;

                // TODO used for create and edit, used to be populated here...
                // context.logObject = logObj;

                // create the edit and create forms
                if ($rootScope.canCreate) {
                    annotationCreateForm.reference = annotationReference.contextualize.entryCreate;
                    annotationCreateForm.reference.columns.forEach(function (column, index) {
                        annotationCreateForm.columnModels[index] = recordCreate.columnToColumnModel(column);
                    });
                }

                if ($rootScope.canUpdate) {
                    annotationEditForm.reference = annotationReference.contextualize.entryEdit;
                    annotationEditForm.reference.columns.forEach(function (column, index) {
                        annotationEditForm.columnModels[index] = recordCreate.columnToColumnModel(column);
                    });
                }

                // TODO needs to be updated
                var logObj = {
                    action: logService.getActionString(logService.logActions.VIEWER_ANNOT_LOAD),
                    stack: logService.getStackObject()
                };

                // TODO how many should we read?
                return $rootScope.annotationReference.read(201, logObj);
            })
            // read the annotation reference
            .then(function getPage(page) {
                // TODO tuples, rows
                // $rootScope.tuples is used for keeping track of changes in the tuple data before it is submitted for update
                $rootScope.tuples = [];
                for(var j = 0; j < page.tuples.length; j++){
                    var row = page.tuples[j].data,
                        tuple = page.tuples[j],
                        shallowCopy = tuple.copy();

                    viewerModel.rows[j] = shallowCopy.data;

                    // TODO foreignKeyData should be added for domain_filter_pattern

                    if(row && row[viewerConstant.annotation.assetColumn]){
                        svgURIs.push(row[viewerConstant.annotation.assetColumn]);
                    }
                }

                console.log('Model: ', viewerModel);

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

                // TODO what if there are no osdViewerQueryParams
                var osdViewerURI = osdViewerLocation + "?" + osdViewerQueryParams;
                console.log('replace uri = '+ osdViewerURI)
                iframe.location.replace(osdViewerURI);
                console.log('Image: ', image);

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
