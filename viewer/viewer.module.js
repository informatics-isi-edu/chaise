(function() {
    'use strict';

    angular.module('chaise.viewer', ['ERMrest', 'ngSanitize', 'ui.select'])

    .config(['context', function configureContext(context) {
        context.serviceURL = window.location.origin + '/ermrest';

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
                context.schemaName = '';
                context.tableName = params[0];
            }
        }
        if (parts[2]) {
            params = parts[2].split('=');
            if (params.length > 1) {
                context.imageID = params[1];
            }
        }
    }])

    // Get session info, hydrate values providers, and set up iframe
    .run(['$http', '$window', 'context', 'image', 'annotations', 'sections', 'anatomies', 'statuses', 'vocabs', 'ermrestClientFactory', function runApp($http, $window, context, image, annotations, sections, anatomies, statuses, vocabs, ermrestClientFactory) {
        var origin = window.location.origin;
        var iframe = document.getElementById('osd').contentWindow;
        var annotoriousReady = false;
        var client = ermrestClientFactory.getClient(context.serviceURL);

        client.getSession().then(function success(response) {
            console.log('Session: ', response);
            context.session = response;
        }, function error(response) {
            console.log(response);
        });

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
                            for (var i = 0; i < _sections.length; i++) {
                                sections.push(_sections[i]);
                            }
                            if (annotoriousReady) {
                                iframe.postMessage({messageType: 'loadAnnotations', content: sections}, origin);
                            }
                            console.log('Sections: ', sections);
                        }, function error(response) {
                            throw response;
                        });

                        var annotationTable = image.entity.getRelatedTable(context.schemaName, 'annotation');
                        annotationTable.getEntities().then(function success(_annotations) {
                            for (var i = 0; i < _annotations.length; i++) {
                                annotations.push(_annotations[i]);
                            }
                            if (annotoriousReady) {
                                iframe.postMessage({messageType: 'loadAnnotations', content: annotations}, origin);
                            }
                            console.log('Annotations: ', annotations);
                        }, function error(response) {
                            throw response;
                        });
                    }, function error(response) {
                        throw response;
                    });
                }

                // Get all rows from "anatomy" table
                var anatomyTable = schema.getTable('anatomy');
                anatomyTable.getEntities().then(function success(_anatomies) {
                    anatomies.push('No Anatomy');
                    for (var j = 0; j < _anatomies.length; j++) {
                        anatomies.push(_anatomies[j].data.term);
                    }
                    console.log('Anatomies: ', anatomies);
                }, function error(response) {
                    throw response;
                });

                // Get all rows from "image_grade_code" table.
                var statusTable = schema.getTable('image_grade_code');
                statusTable.getEntities().then(function success(_statuses) {
                    for (var j = 0; j < _statuses.length; j++) {
                        statuses.push(_statuses[j].data.code);
                    }
                    console.log('Statuses: ', statuses);
                }, function error(response) {
                    throw response;
                });


                // Get all rows from "tissues" table
                var tissueTable = schema.getTable('tissue');
                tissueTable.getEntities().then(function success(_tissues) {
                    vocabs['tissue'] = [];
                    for (var j = 0; j < _tissues.length; j++) {
                        vocabs['tissue'].push(_tissues[j].data.term);
                    }
                }, function error(response) {
                    throw response;
                });

                // Get all rows from "age stage" table
                var ageStageTable = schema.getTable('age_stage');
                ageStageTable.getEntities().then(function success(_stages) {
                    vocabs['age_stage'] = [];
                    for (var j = 0; j < _stages.length; j++) {
                        vocabs['age_stage'].push(_stages[j].data.term);
                    }
                }, function error(response) {
                    throw response;
                });

                // Get all rows from "gender" table
                var genderTable = schema.getTable('gender');
                genderTable.getEntities().then(function success(_genders) {
                    vocabs['gender'] = [];
                    for (var j = 0; j < _genders.length; j++) {
                        vocabs['gender'].push(_genders[j].data.term);
                    }
                }, function error(response) {
                    throw response;
                });

                // Get all rows from "specimen_fixation" table
                var specimenFixationTable = schema.getTable('specimen_fixation');
                specimenFixationTable.getEntities().then(function success(_fixations) {
                    vocabs['specimen_fixation'] = [];
                    for (var j = 0; j < _fixations.length; j++) {
                        vocabs['specimen_fixation'].push(_fixations[j].data.term);
                    }
                }, function error(response) {
                    throw response;
                });

                // Get all rows from "embedding_medium" table
                var embeddingMediumTable = schema.getTable('embedding_medium');
                embeddingMediumTable.getEntities().then(function success(_media) {
                    vocabs['embedding_medium'] = [];
                    for (var j = 0; j < _media.length; j++) {
                        vocabs['embedding_medium'].push(_media[j].data.term);
                    }
                    console.log('Vocabs: ', vocabs);
                }, function error(response) {
                    throw response;
                });

                // Get all rows from "staining_protocol" table
                var stainingProtocolTable = schema.getTable('staining_protocol');
                stainingProtocolTable.getEntities().then(function success(_protocols) {
                    vocabs['staining_protocol'] = [];
                    for (var j = 0; j < _protocols.length; j++) {
                        vocabs['staining_protocol'].push(_protocols[j].data.term);
                    }
                }, function error(response) {
                    throw response;
                });
            }
        }, function error(response) {
            if (response.status == 401) {
                if (chaiseConfig.authnProvider == 'goauth') {
                    getGoauth(encodeSafeURIComponent(window.location.href));
                }
                console.log(response);
            }
        });

        $window.addEventListener('message', function(event) {
            if (event.origin === origin) {
                if (event.data.messageType == 'annotoriousReady') {
                    annotoriousReady = event.data.content;
                    if (annotoriousReady) {
                        iframe.postMessage({messageType: 'loadAnnotations', content: sections}, origin);
                        iframe.postMessage({messageType: 'loadAnnotations', content: annotations}, origin);
                    }
                }
            } else {
                console.log('Invalid event origin. Event origin: ', origin, '. Expected origin: ', window.location.origin);
            }
        });

        function encodeSafeURIComponent (str) {
            return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
                return '%' + c.charCodeAt(0).toString(16).toUpperCase();
            });
        }

        function getGoauth(referrer) {
            var url = '/ermrest/authn/preauth?referrer=' + referrer;
            $http.get(url).then(function success(response) {
                console.log('Success: ', response);
                window.open(response.data.redirect_url, '_self');
            }, function error(response) {
                console.log('Error: ', error);
            });
        }
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
