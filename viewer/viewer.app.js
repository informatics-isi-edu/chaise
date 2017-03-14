(function() {
    'use strict';

    var client;

    angular.module('chaise.viewer', [
        'ermrestjs',
        'ngSanitize',
        'chaise.alerts',
        'chaise.filters',
        'ngCookies',
        'chaise.authen',
        'chaise.errors',
        'chaise.delete',
        'chaise.modal',
        'ui.select',
        'ui.bootstrap',
        'ng.deviceDetector'
    ])

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

    // Configure all tooltips to be attached to the body by default. To attach a
    // tooltip on the element instead, set the `tooltip-append-to-body` attribute
    // to `false` on the element.
    .config(['$uibTooltipProvider', function($uibTooltipProvider) {
        $uibTooltipProvider.options({appendToBody: true});
    }])

    // Get a client connection to ERMrest
    // Note: Only Providers and Constants can be dependencies in .config blocks. So
    // if you want to use a factory or service (e.g. $window or your custom one)
    // in a .config block, you append 'Provider' to the dependency name and call
    // .$get() on it. This returns a Provider instance of the factory/service.
    .config(['ERMrestProvider', 'context', function configureClient(ERMrestProvider, context) {
        client = ERMrestProvider.$get().ermrestFactory.getServer(context.serviceURL, {cid: context.appName});
    }])

    // Set user info
    .config(['userProvider', 'context', 'SessionProvider', function configureUser(userProvider, context, SessionProvider) {

        SessionProvider.$get().getSession().then(function success(session) {
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
    .run(['headInjector', '$window', 'context', 'image', 'annotations', 'comments', 'anatomies', 'user', function runApp(headInjector, $window, context, image, annotations, comments, anatomies) {
        headInjector.addTitle();
        headInjector.addCustomCSS();
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
/*
<button ng-click="osd.filterChannels();" class="btn btn-success" ng-class="{'pick':!osd.filterChannelsAreHidden}" type="button" role="button" title="channel filtering" id="filter-btn">
*/
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
