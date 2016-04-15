(function() {
    'use strict';

    var client;

    angular.module('chaise.viewer', ['ERMrest', 'ngSanitize', 'chaise.filters', 'ui.select'])

    // Configure the context info from the URI
    .config(['context', function configureContext(context) {
        if (chaiseConfig.headTitle !== undefined) {
            document.getElementsByTagName('head')[0].getElementsByTagName('title')[0].innerHTML = chaiseConfig.headTitle;
        }

        // TODO: Style guide preferences?
        context.serviceURL = window.location.origin + '/ermrest';

        if (chaiseConfig.ermrestLocation) {
            context.serviceURL = chaiseConfig.ermrestLocation;
        }

        var hash = window.location.hash;

        if (hash === undefined || hash == '' || hash.length == 1) {
            return;
        }

        var parts = hash.substring(1).split('/');
        context.catalogID = parts[0];
        if (parts[1]) {
            var params = parts[1].split(':');
            if (params.length > 1) {
                context.schemaName = params[0];
                context.tableName = params[1];
            } else {
                context.tableName = params[0];
            }
        }
        if (parts[2]) {
            params = parts[2].split('=');
            if (params.length > 1) {
                context.imageID = params[1];
            }
        }

        // TODO: Check if context has everything it needs before proceeding. If not, Bad Request
    }])

    // Get a client connection to ERMrest
    // Note: Only Providers and Constants can be dependencies in .config blocks. So
    // if you want to use a factory or service (e.g. $window or your custom one)
    // in a .config block, you append 'Provider' to the dependency name and call
    // .$get() on it. This returns a Provider instance of the factory/service.
    .config(['ermrestClientFactoryProvider', 'context', function configureClient(ermrestClientFactoryProvider, context) {
        client = ermrestClientFactoryProvider.$get().getClient(context.serviceURL);
    }])

    // Set user info
    .config(['userProvider', 'context', function configureUser(userProvider, context) {
        client.getSession().then(function success(session) {
            console.log('Session: ', session);
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
    .run(['$window', 'context', 'image', 'annotations', 'comments', 'sections', 'anatomies', 'statuses', 'vocabs', 'user', function runApp($window, context, image, annotations, comments, sections, anatomies, statuses, vocabs) {
        var origin = $window.location.origin;
        var iframe = $window.frames[0];
        var annotoriousReady = false;
        var chaiseReady = false;
        var arrows = [];
        var rectangles = [];

        var catalog = client.getCatalog(context.catalogID);
        catalog.introspect().then(function success(schemas) {
            console.log('Schemas: ', schemas);
            var schema = schemas[context.schemaName];
            if (schema) {
                var table = schema.getTable(context.tableName);
                var filteredTable = table.getFilteredTable(['id=' + context.imageID]);
                if (filteredTable) {
                    filteredTable.getEntities().then(function success(_entities) {
                        image.entity = _entities[0];
                        iframe.location.replace(image.entity.data.uri);
                        console.log('Image: ', image);

                        var sectionTable = image.entity.getRelatedTable(context.schemaName, 'section_annotation');
                        sectionTable.getEntities().then(function success(_sections) {
                            var length = _sections.length;
                            for (var i = 0; i < length; i++) {
                                sections.push(_sections[i]);
                            }
                            if (annotoriousReady) {
                                iframe.postMessage({messageType: 'loadSpecialAnnotations', content: sections}, origin);
                            }
                            console.log('Sections: ', sections);
                        }, function error(response) {
                            throw response;
                        });

                        var annotationTable = image.entity.getRelatedTable(context.schemaName, 'annotation');
                        annotationTable.getEntities().then(function success(_annotations) {
                            var length = _annotations.length;
                            for (var i = 0; i < length; i++) {
                                var annotation = _annotations[i];
                                annotations.push(annotation);
                                if (annotation.data.type == 'arrow') {
                                    arrows.push(annotation);
                                } else if (annotation.data.type == 'rectangle') {
                                    rectangles.push(annotation);
                                }
                            }
                            chaiseReady = true;

                            if (annotoriousReady && chaiseReady) {
                                iframe.postMessage({messageType: 'loadArrowAnnotations', content: arrows}, origin);
                                iframe.postMessage({messageType: 'loadAnnotations', content: rectangles}, origin);
                            }
                            console.log('Annotations: ', annotations);
                        }, function error(response) {
                            throw response;
                        });

                        // Get all the comments for this image
                        var commentTable = annotationTable.getRelatedTable(context.schemaName, 'annotation_comment');
                        commentTable.getEntities().then(function success(_comments) {
                            var length = _comments.length;
                            for (var i = 0; i < length; i++) {
                                var annotationId = _comments[i].data.annotation_id;
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
                }

                // Get all rows from "anatomy" table
                var anatomyTable = schema.getTable('anatomy');
                anatomyTable.getEntities().then(function success(_anatomies) {
                    anatomies.push('No Anatomy');
                    var length = _anatomies.length;
                    for (var j = 0; j < length; j++) {
                        anatomies.push(_anatomies[j].data.term);
                    }
                }, function error(response) {
                    throw response;
                });

                // Get all rows from "image_grade_code" table.
                var statusTable = schema.getTable('image_grade_code');
                statusTable.getEntities().then(function success(_statuses) {
                    var length = _statuses.length;
                    for (var j = 0; j < length; j++) {
                        statuses.push(_statuses[j].data.code);
                    }
                }, function error(response) {
                    throw response;
                });


                // Get all rows from "tissues" table
                var tissueTable = schema.getTable('tissue');
                tissueTable.getEntities().then(function success(_tissues) {
                    var length = _tissues.length;
                    vocabs['tissue'] = [];
                    for (var j = 0; j < length; j++) {
                        vocabs['tissue'].push(_tissues[j].data.term);
                    }
                }, function error(response) {
                    throw response;
                });

                // Get all rows from "age stage" table
                var ageStageTable = schema.getTable('age_stage');
                ageStageTable.getEntities().then(function success(_stages) {
                    var length = _stages.length;
                    vocabs['age_stage'] = [];
                    for (var j = 0; j < length; j++) {
                        vocabs['age_stage'].push(_stages[j].data.term);
                    }
                }, function error(response) {
                    throw response;
                });

                // Get all rows from "gender" table
                var genderTable = schema.getTable('gender');
                genderTable.getEntities().then(function success(_genders) {
                    var length = _genders.length;
                    vocabs['gender'] = [];
                    for (var j = 0; j < length; j++) {
                        vocabs['gender'].push(_genders[j].data.term);
                    }
                }, function error(response) {
                    throw response;
                });

                // Get all rows from "specimen_fixation" table
                var specimenFixationTable = schema.getTable('specimen_fixation');
                specimenFixationTable.getEntities().then(function success(_fixations) {
                    var length = _fixations.length;
                    vocabs['specimen_fixation'] = [];
                    for (var j = 0; j < length; j++) {
                        vocabs['specimen_fixation'].push(_fixations[j].data.term);
                    }
                }, function error(response) {
                    throw response;
                });

                // Get all rows from "embedding_medium" table
                var embeddingMediumTable = schema.getTable('embedding_medium');
                embeddingMediumTable.getEntities().then(function success(_media) {
                    var length = _media.length;
                    vocabs['embedding_medium'] = [];
                    for (var j = 0; j < _media.length; j++) {
                        vocabs['embedding_medium'].push(_media[j].data.term);
                    }
                }, function error(response) {
                    throw response;
                });

                // Get all rows from "staining_protocol" table
                var stainingProtocolTable = schema.getTable('staining_protocol');
                stainingProtocolTable.getEntities().then(function success(_protocols) {
                    var length = _protocols.length;
                    vocabs['staining_protocol'] = [];
                    for (var j = 0; j < length; j++) {
                        vocabs['staining_protocol'].push(_protocols[j].data.term);
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
                        iframe.postMessage({messageType: 'loadSpecialAnnotations', content: sections}, origin);
                        iframe.postMessage({messageType: 'loadArrowAnnotations', content: arrows}, origin);
                        iframe.postMessage({messageType: 'loadAnnotations', content: rectangles}, origin);
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
