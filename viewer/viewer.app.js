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
        'chaise.record.table',
        'chaise.utils',
        'ermrestjs',
        'ngCookies',
        'ngSanitize',
        'ui.select',
        'ui.bootstrap',
        'ng.deviceDetector'
    ])

    .config(['$provide', function($provide) {
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
    .run(['ConfigUtils', 'ERMrest', 'DataUtils', 'FunctionUtils',  'UiUtils', 'UriUtils', 'logService', '$window', 'context', 'image', 'annotations', 'comments', 'anatomies', 'user', 'MathUtils', '$rootScope', function runApp(ConfigUtils, ERMrest, DataUtils, FunctionUtils, UiUtils, UriUtils, logService, $window, context, image, annotations, comments, anatomies, user, MathUtils, $rootScope) {
        var origin = $window.location.origin;
        var iframe = $window.frames[0];
        var annotoriousReady = false;
        var chaiseReady = false;
        $rootScope.displayReady = false;

        var arrows = [];
        var rectangles = [];
        var sections = [];

        var origin = $window.location.origin;
        var iframe = $window.frames[0];
        var annotoriousReady = false;
        var chaiseReady = false;
        var arrows = [];
        var rectangles = [];
        var sections = [];
        var specimenURL = "https://dev.rebuildingakidney.org/ermrest/catalog/2/entity/Gene_Expression:Specimen_Expression";
        var config = ConfigUtils.getContextJSON();
        context.server = config.server;
        context.wid = config.wid;
        context.cid = config.cid;
        context.pid = config.pid;
        context.chaiseBaseURL = UriUtils.chaiseBaseURL();
        UriUtils.setOrigin();

        var res = UriUtils.chaiseURItoErmrestURI($window.location, true);
        var ermrestUri = res.ermrestUri,
            pcid = res.pcid,
            ppid = res.ppid,
            isQueryParameter = res.isQueryParameter;

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

        ERMrest.resolve(specimenURL, { cid: context.cid, pid: context.pid, wid: context.wid }).then(function(reference){
            console.log("reference : ", reference);

            // we are using filter to determine app mode, the logic for getting filter
            // should be in the parser and we should not duplicate it in here
            // NOTE: we might need to change this line (we're parsing the whole url just for fidinig if there's filter)
            var location = reference.location;

            // Mode can be any 3 with a filter
            if (location.filter || location.facets) {
                // prefill always means create
                // copy means copy regardless of a limit defined
                // edit is everything else with a filter
                context.mode = (context.queryParams.prefill ? context.modes.CREATE : (context.queryParams.copy ? context.modes.COPY : context.modes.EDIT));
            } else if (context.queryParams.limit) {
                context.mode = context.modes.EDIT;
            }
            context.appContext = (context.mode == context.modes.EDIT ? "entry/edit" : "entry/create");

            //contextualize the reference based on the mode (determined above) recordedit is in
            if (context.mode == context.modes.EDIT) {
                $rootScope.reference = reference.contextualize.entryEdit;
            } else if (context.mode == context.modes.CREATE || context.mode == context.modes.COPY) {
                $rootScope.reference = reference.contextualize.entryCreate;
            }

            if (typeof session !== "undefined") {
                $rootScope.reference.session = session;
                $rootScope.session = session;
            }
            // $rootScope.reference = reference;

            // log attribues
            $rootScope.logStackPath = logService.logStackPaths.SET;
            $rootScope.logStack = [
                logService.getStackNode(
                    logService.logStackTypes.SET,
                    $rootScope.reference.table,
                    $rootScope.reference.filterLogInfo
                )
            ];

        }, function error(response){
            console.log("ERMrest error : ", response );
        })

        ConfigUtils.getContextJSON().server.catalogs.get(context.catalogID).then(function success(catalog) {
            var schema = catalog.schemas.get(context.schemaName);
            // So the schema and tables can be accessed in controllers
            context.schema = schema;
            console.log('Schema: ', schema);
            if (schema) {
                var table = schema.tables.get(context.tableName);
                // BinaryPredicate(column, operator, value) is used for building a filter
                // This predicate is used to get the image based on the id of the image the user is navigating to
                var imagePath = new ERMrest.DataPath(table);
                var imagePathColumn = imagePath.context.columns.get('id');
                var imageFilter = new ERMrest.BinaryPredicate(imagePathColumn, ERMrest.OPERATOR.EQUAL, context.imageID);

                $rootScope.logStackPath = logService.logStackPaths.ENTITY;
                $rootScope.logStack = [
                    logService.getStackNode(
                        logService.logStackTypes.ENTITY,
                        table,
                        {
                            "and": [
                                {"source": "id", "choices": [context.imageID]}
                            ]
                        }
                    )
                ];

                var contextHeaderParams = {
                    catalog: context.catalogID,
                    schema_table: context.schemaName + ":" + context.tableName,
                    action: logService.getActionString(logService.logActions.LOAD),
                    stack: logService.getStackObject()
                };

                if (context.queryParams && context.queryParams.ppid) {
                    contextHeaderParams.ppid = context.queryParams.ppid;
                }

                if (context.queryParams && context.queryParams.pcid) {
                    contextHeaderParams.pcid = context.queryParams.pcid;
                }
                imagePath.filter(imageFilter).entity.get(contextHeaderParams).then(function success(entity) {
                    image.entity = entity[0];
                    var waterMark = context.queryParams.waterMark;
                    if (waterMark === undefined) {
                    	waterMark = '';
                    } else {
                    	waterMark = '&waterMark=' + waterMark;
                    }

                    var meterScaleInPixels = context.queryParams.meterScaleInPixels;
                    if (meterScaleInPixels === undefined) {
                      meterScaleInPixels = '';
                    } else {
                      meterScaleInPixels = '&meterScaleInPixels=' + meterScaleInPixels;
                    }

                    console.log('uri='+image.entity.uri + waterMark);

                    var osdViewerPath =  origin + UriUtils.OSDViewerDeploymentPath() + "mview.html";

                    /* Note: the following has been done so that the viewer app supports both type of formats i.e tiff and czi.
                      It calls the new OpenSeadragon viewer app with parameters based on the file format. Need to change this, when we
                      will start getting svg files in the URL itself instead of making a call to ermrest.
                      Currently it's a HACK
                    */
                    var params = window.location.href.split("?");
                    if(window.location.href.indexOf("url") > -1){
                      image.entity.uri = osdViewerPath + "?" + params[1];
                    } else {
                      var old_params = image.entity.uri.split("?");
                      image.entity.uri = osdViewerPath + "?" + old_params[1];
                    }

                    // image.entity.uri = image.entity.uri + "&url=data/Q-296R_all_contours_cw_named.svg";
                    console.log('replace uri = '+image.entity.uri + waterMark + meterScaleInPixels)
                    iframe.location.replace(image.entity.uri + waterMark + meterScaleInPixels);
                    console.log('Image: ', image);

                    var annotationTable = schema.tables.get('annotation');
                    var annotationPath = imagePath.extend(annotationTable).datapath;
                    var contextHeaderParams = {
                        catalog: context.catalogID,
                        schema_table: context.schemaName + ":annotation",
                        action: logService.getActionString(logService.logActions.VIEWER_ANNOT_LOAD),
                        stack: logService.getStackObject()
                    };
                    annotationPath.filter(imageFilter).entity.get(contextHeaderParams).then(function success(_annotations) {
                        var length = _annotations.length;
                        for (var i = 0; i < length; i++) {
                            _annotations[i].table = annotationPath.context.table.name;
                            var annotation = _annotations[i];
                            if (!annotation.config) {
                                annotation.config = {};
                            }
                            annotations.push(annotation);
                        }
                        chaiseReady = true;
                        if (annotoriousReady && chaiseReady) {
                            iframe.postMessage({messageType: 'loadAnnotations', content: annotations}, origin);
                        }
                        console.log('Annotations: ', annotations);

                        var commentTable = schema.tables.get('annotation_comment');
                        var commentPath = annotationPath.extend(commentTable).datapath;
                        var contextHeaderParams = {
                            catalog: context.catalogID,
                            schema_table: context.schemaName + ":annotation_comment",
                            action: logService.getActionString(logService.logActions.VIEWER_ANNOT_COMMENT_LOAD),
                            stack: logService.getStackObject()
                        };

                        // Get all the comments for this image
                        // Nest comments fetch in annotations so annotations will be fetched and loaded to the DOM before the comments
                        commentPath.filter(imageFilter).entity.get(contextHeaderParams).then(function success(_comments){
                            var length = _comments.length;
                            for (var i = 0; i < length; i++) {
                                _comments[i].table = commentPath.context.table.name;
                                var annotationId = _comments[i].annotation_id;
                                if (!comments[annotationId]) {
                                    comments[annotationId] = [];
                                }
                                comments[annotationId].push(_comments[i]);
                            }
                            console.log('Comments: ', comments);
                        }, function error(response) {
                            console.log(response);
                        });

                    }, function error(response) {
                        throw response;
                    });
                }, function error(response) {
                    throw response;
                });

                // Get all rows from "anatomy" table
                var anatomyTable = schema.tables.get('anatomy');
                var anatomyPath = new ERMrest.DataPath(anatomyTable);
                var contextHeaderParams = {
                    catalog: context.catalogID,
                    schema_table: context.schemaName + ":anatomy",
                    action: logService.getActionString(logService.logActions.VIEWER_ANATOMY_LOAD),
                    stack: logService.getStackObject()
                };
                anatomyPath.entity.get(contextHeaderParams).then(function success(_anatomies) {
                    anatomies.push('No Anatomy');
                    var length = _anatomies.length;
                    for (var j = 0; j < length; j++) {
                        anatomies.push(_anatomies[j].term);
                    }
                    anatomies.sort(function sortAnatomies(a, b) {
                        a = a.toLowerCase();
                        b = b.toLowerCase();
                        if (a < b) {
                            return -1;
                        } else if (a > b) {
                            return 1;
                        } else {
                            return 0;
                        }
                    });
                }, function error(response) {
                    throw response;
                });
            }
        }, function error(response) {
          console.log(response);
        });

        // Set up a listener for all "message" events
        $window.addEventListener('message', function(event) {
            if (event.origin === origin) {
                if (event.data.messageType == 'annotoriousReady') {
                    annotoriousReady = event.data.content;
                    if (annotoriousReady && chaiseReady) {
                        iframe.postMessage({messageType: 'loadAnnotations', content: annotations}, origin);
                    }
                } else if (event.data.messageType == 'dismissChannels') {
                  window.console.log("XXX pull off the channels filtering pullout..");
                  var btnptr = $('#filter-btn');
                  btnptr.click();
                }
                // should really capture the 'unhandled' message type here..
            } else {
                console.log('Invalid event origin. Event origin: ', origin, '. Expected origin: ', window.location.origin);
            }
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
