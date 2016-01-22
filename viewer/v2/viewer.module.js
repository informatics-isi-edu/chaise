(function() {
    'use strict';

    angular.module('chaise.viewer', ['ERMrest'])


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


    .run(['$q', '$window', 'context', 'image', 'annotations', 'anatomies', 'ermrestClientFactory', function run($q, $window, context, image, annotations, anatomies, ermrestClientFactory) {
        var client = ermrestClientFactory.getClient(context.serviceURL);
        var catalog = client.getCatalog(context.catalogID);
        var deferredAnnotations = $q.defer();
        catalog.introspect().then(function success(schemas) {
            var schema = schemas[context.schemaName];
            if (schema) {
                var table = schema.getTable(context.tableName);
                var filteredTable = table.getFilteredTable(['id=' + context.imageID]);
                if (filteredTable) {
                    filteredTable.getEntities().then(function success(_entities) {
                        image[0] = _entities[0];
                        console.log('Image: ', image);
                        var annotationTable = image[0].getRelatedTable(context.schemaName, 'annotation');
                        annotationTable.getEntities().then(function success(_annotations) {
                            for (var i = 0; i < _annotations.length; i++) {
                                annotations.push(_annotations[i]);
                            }
                            console.log('Annotations: ', annotations);
                        }, function error(response) {
                            throw response;
                        });
                    }, function error(response) {
                        throw response;
                    });
                }
                var anatomyTable = schema.getTable('anatomy');
                anatomyTable.getEntities().then(function success(_anatomies) {
                    for (var j = 0; j < _anatomies.length; j++) {
                        anatomies.push(_anatomies[j]);
                    }
                    console.log('Anatomies: ', anatomies);
                }, function error(response) {
                    throw response;
                });
            }
        });

        $window.addEventListener('message', function(event) {
            var origin = window.location.origin;
            if (event.origin === origin) {
                if (event.data.messageType === 'annotoriousReady') {
                    if (annotations) {
                        deferredAnnotations.resolve(annotations);
                        $window.frames[0].postMessage({messageType: 'loadAnnotations', content: annotations}, origin);
                    }
                }
            } else {
                console.log('Invalid event origin. Event origin: ', origin, '. Expected origin: ', window.location.origin);
            }
        });

    }]);
})();
