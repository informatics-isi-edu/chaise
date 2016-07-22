(function() {
    'use strict';

    var client;

    angular.module('chaise.viewer', [
        'ERMrest',
        'ngSanitize',
        'chaise.alerts',
        'chaise.filters',
        'chaise.authen',
        'chaise.errors',
        'chaise.delete',
        'chaise.modal',
        'ui.select',
        'ui.bootstrap'
    ])

    // Configure the context info from the URI
    .config(['context', 'UriUtilsProvider', function configureContext(context, UriUtilsProvider) {
        var utils = UriUtilsProvider.$get();

        if (chaiseConfig.headTitle !== undefined) {
            document.getElementsByTagName('head')[0].getElementsByTagName('title')[0].innerHTML = chaiseConfig.headTitle;
        }

        // Parse the URL
        utils.setOrigin();
        utils.parseURLFragment(window.location, context);

        // should we allow for improper URLs here?
        // what if there are 2 filters and the id filter is the second one.
        // Is that improper or should it be parsed and ignore the other filter?
        var filter = context.filter;
        if (filter.type === "BinaryPredicate" &&
            filter.operator === "=" &&
            filter.column.toLowerCase() === "id") {
            context.imageID = filter.value;
        }

        console.log('Context', context);
        // TODO: Check if context has everything it needs before proceeding. If not, Bad Request
    }])

    // Get a client connection to ERMrest
    // Note: Only Providers and Constants can be dependencies in .config blocks. So
    // if you want to use a factory or service (e.g. $window or your custom one)
    // in a .config block, you append 'Provider' to the dependency name and call
    // .$get() on it. This returns a Provider instance of the factory/service.
    .config(['ermrestServerFactoryProvider', 'context', function configureClient(ermrestServerFactoryProvider, context) {
        client = ermrestServerFactoryProvider.$get().getServer(context.serviceURL, {cid: context.appName});
    }])

    // Set user info
    .config(['userProvider', 'context', 'SessionProvider', function configureUser(userProvider, context, SessionProvider) {

        SessionProvider.$get().getSession().then(function success(session) {
            var groups = context.groups;
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
            // TODO: Abstract this away..
            if (response.status == 401 || response.status == 404) {
                if (chaiseConfig.authnProvider == 'goauth') {
                    // TODO: Is it worth injecting $window here?
                    getGoauth(encodeSafeURIComponent(window.location.href));
                }
                console.log(response);
                throw response;
            }
        });

        function getGoauth(referrer) {
            var url = '/ermrest/authn/preauth?referrer=' + referrer;
            // Inject $http service
            var $http = angular.injector(['ng']).get('$http');
            $http.get(url).then(function success(response) {
                console.log('Success: ', response);
                window.open(response.data.redirect_url, '_self');
            }, function error(response) {
                console.log('Error: ', response);
                throw response;
            });
        }

        function encodeSafeURIComponent (str) {
            return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
                return '%' + c.charCodeAt(0).toString(16).toUpperCase();
            });
        }
    }])

    // Hydrate values providers and set up iframe
    .run(['$window', 'context', 'image', 'annotations', 'comments', 'anatomies', 'statuses', 'vocabs', 'user', function runApp($window, context, image, annotations, comments, anatomies, statuses, vocabs) {
        var origin = $window.location.origin;
        var iframe = $window.frames[0];
        var annotoriousReady = false;
        var chaiseReady = false;
        var arrows = [];
        var rectangles = [];
        var sections = [];

        client.catalogs.get(context.catalogID).then(function success(catalog) {
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
                imagePath.filter(imageFilter).entity.get().then(function success(entity) {
                    image.entity = entity[0];
                    iframe.location.replace(image.entity.uri);
                    console.log('Image: ', image);

                    var annotationTable = schema.tables.get('annotation');
                    var annotationPath = imagePath.extend(annotationTable).datapath;
                    annotationPath.filter(imageFilter).entity.get().then(function success(_annotations) {
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

                        // Get all the comments for this image
                        // Nest comments fetch in annotations so annotations will be fetched and loaded to the DOM before the comments
                        commentPath.filter(imageFilter).entity.get().then(function success(_comments){
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
                anatomyPath.entity.get().then(function success(_anatomies) {
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

                // Get all rows from "image_grade_code" table.
                var statusTable = schema.tables.get('image_grade_code');
                var statusPath = new ERMrest.DataPath(statusTable);
                statusPath.entity.get().then(function success(_statuses) {
                    var length = _statuses.length;
                    for (var j = 0; j < length; j++) {
                        statuses.push(_statuses[j].code);
                    }
                }, function error(response) {
                    throw response;
                });


                // Get all rows from "tissues" table
                var tissueTable = schema.tables.get('tissue');
                var tissuePath = new ERMrest.DataPath(tissueTable);
                tissuePath.entity.get().then(function success(_tissues) {
                    var length = _tissues.length;
                    vocabs['tissue'] = [];
                    for (var j = 0; j < length; j++) {
                        vocabs['tissue'].push(_tissues[j].term);
                    }
                }, function error(response) {
                    throw response;
                });

                // Get all rows from "age stage" table
                var ageStageTable = schema.tables.get('age_stage');
                var ageStagePath = new ERMrest.DataPath(ageStageTable);
                ageStagePath.entity.get().then(function success(_stages) {
                    var length = _stages.length;
                    vocabs['age_stage'] = [];
                    for (var j = 0; j < length; j++) {
                        vocabs['age_stage'].push(_stages[j].term);
                    }
                }, function error(response) {
                    throw response;
                });

                // Get all rows from "gender" table
                var genderTable = schema.tables.get('gender');
                var genderPath = new ERMrest.DataPath(genderTable);
                genderPath.entity.get().then(function success(_genders) {
                    var length = _genders.length;
                    vocabs['gender'] = [];
                    for (var j = 0; j < length; j++) {
                        vocabs['gender'].push(_genders[j].term);
                    }
                }, function error(response) {
                    throw response;
                });

                // Get all rows from "specimen_fixation" table
                var specimenFixationTable = schema.tables.get('specimen_fixation');
                var specimenFixationPath = new ERMrest.DataPath(specimenFixationTable);
                specimenFixationPath.entity.get().then(function success(_fixations) {
                    var length = _fixations.length;
                    vocabs['specimen_fixation'] = [];
                    for (var j = 0; j < length; j++) {
                        vocabs['specimen_fixation'].push(_fixations[j].term);
                    }
                }, function error(response) {
                    throw response;
                });

                // Get all rows from "embedding_medium" table
                var embeddingMediumTable = schema.tables.get('embedding_medium');
                var embeddingMediumPath = new ERMrest.DataPath(embeddingMediumTable);
                embeddingMediumPath.entity.get().then(function success(_media) {
                    var length = _media.length;
                    vocabs['embedding_medium'] = [];
                    for (var j = 0; j < _media.length; j++) {
                        vocabs['embedding_medium'].push(_media[j].term);
                    }
                }, function error(response) {
                    throw response;
                });

                // Get all rows from "staining_protocol" table
                var stainingProtocolTable = schema.tables.get('staining_protocol');
                var stainingProtocolPath = new ERMrest.DataPath(stainingProtocolTable);
                stainingProtocolPath.entity.get().then(function success(_protocols) {
                    var length = _protocols.length;
                    vocabs['staining_protocol'] = [];
                    for (var j = 0; j < length; j++) {
                        vocabs['staining_protocol'].push(_protocols[j].term);
                    }
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
                }
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
