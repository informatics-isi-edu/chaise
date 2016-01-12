// openSeadragonApp: Defines the Angular application ==================================================================================================================================
var openSeadragonApp = angular.module('openSeadragonApp', ['ERMrest']);

// ERMrestService: A service for operations that deal with the ERMrest db =============================================================================================================
openSeadragonApp.service('ERMrestService', ['ermrestClientFactory', '$http', function(ermrestClientFactory, $http) {
    var client = ermrestClientFactory.getClient(window.location.origin + '/ermrest', null);
    var catalog = client.getCatalog(1);

    // Get a reference to the ERMrestService service
    var self = this;

    // Parse Chaise url to determine required parameters to find the requested entity
    this.path = window.location.hash;
    this.params = this.path.split('/');
    this.catalogId = this.params[0].substring(1);
    this.schemaName = this.params[1].split(':')[0];
    this.tableName = this.params[1].split(':')[1];
    this.entityId = this.params[2].split('=')[1];

    var ERMREST_ENDPOINT = window.location.origin + '/ermrest/catalog/';
    if (chaiseConfig['ermrestLocation'] != null) {
        ERMREST_ENDPOINT = chaiseConfig['ermrestLocation'] + '/ermrest/catalog';
    }

    // Returns a Schema object from ERMrest
    this.getSchema = function getSchema() {
        return catalog.introspect().then(function(schemas) {
            return schemas[self.schemaName];
        });
    };

    // Returns the uri value from a row in rbk:image (filtered by the id found in URL)
    this.getEntity = function getEntity() {
        return this.getSchema().then(function(schema) {
            var table = schema.getTable(self.tableName);
            var filteredTable = table.getFilteredTable(["id=" + self.entityId]);
            return filteredTable.getRows().then(function(rows) {
                return rows[0].data.uri;
            });
        });
    };

    this.insertRoi = function insertRoi(x, y, width, height, context) {
        var timestamp = new Date().toISOString();
        var coordinates = [x, y, width, height];
        var roi = [{
            "id": null,
            "image_id": parseInt(this.entityId),
            "author": null,
            "timestamp": timestamp,
            "coords": coordinates,
            "context_uri": context,
            "anatomy": null
        }];
        var entityPath = ERMREST_ENDPOINT + this.catalogId + '/entity/' + this.schemaName + ':roi?defaults=id,author';
        return $http.post(entityPath, roi);
    };

    this.insertRoiComment = function insertRoiComment(roiId, comment) {
        var timestamp = new Date().toISOString();
        var roiComment = [{
            "id": null,
            "roi_id": roiId,
            "author": null,
            "timestamp": timestamp,
            "comment": comment
        }];

        var entityPath = ERMREST_ENDPOINT + this.catalogId + '/entity/' + this.schemaName + ':roi_comment?defaults=id,author';
        return $http.post(entityPath, roiComment);
    };

    this.createAnnotation = function createAnnotation(annotation) {
        var timestamp = new Date().toISOString();
        annotation = [{
            "image_id": self.entityId,
            "timestamp": timestamp,
            "anatomy": null,
            "context_uri": annotation.context_uri,
            "coords": [
                annotation.shape.geometry.x,
                annotation.shape.geometry.y,
                annotation.shape.geometry.width,
                annotation.shape.geometry.height
            ],
            "description": annotation.description
        }];
        return this.getSchema().then(function(schema) {
            var table = schema.getTable('roi');
            return table.createEntity(annotation, ['id', 'author']).then(function(response) {
                return response;
            });
        });
    };

    // TODO: Rewrite this with ermrestjs
    this.updateAnnotation = function updateAnnotation(annotation) {
        var editedAnnotation = [{
            "id": annotation.id,
            "image_id": this.entityId,
            "author": null,
            "context_uri": annotation.context_uri,
            "coords": annotation.coords,
            "description": annotation.description
        }];
        var entityPath = ERMREST_ENDPOINT + this.catalogId + '/entity/' + this.schemaName + ':roi';
        return $http.put(entityPath, editedAnnotation);
    };

    this.getAnnotations = function getAnnotations() {
        var annotations = [];
        this.getSchema().then(function(schema) {
            var roiTable = schema.getTable('roi');
            var filteredRoiTable = roiTable.getFilteredTable(["image_id=" + self.entityId]);
            return filteredRoiTable.getRows().then(function(roiRows) {
                if (roiRows.length > 0) {
                    return Promise.all(roiRows.map(function(roi) {
                        annotations.push(roi.data);
                    }));
                } else {
                    console.log('No annotations found for this image.')
                }
            });
        });
        return annotations;
    };

    this.deleteAnnotation = function deleteAnnotation(annotation) {
        this.getSchema().then(function(schema) {
            var table = schema.getTable('roi');
            var filteredTable = table.getFilteredTable(["id=" + annotation.id]);
            return filteredTable.getRows().then(function(rows) {
                rows[0].delete();
            });
        });
    };
}]);

// MainController: An Angular controller to update the view ===========================================================================================================================
openSeadragonApp.controller('MainController', ['$scope', 'ERMrestService', function($scope, ERMrestService) {
    $scope.annotations = ERMrestService.getAnnotations();

    $scope.viewerSource = null; // The source URL of the iframe/viewer
    $scope.viewerReady = false; // True if viewer (OpenSeadragon/Annotorious) has finished setup
    $scope.viewer = null; // A reference to the iframe window

    $scope.highlightedAnnotation = null; // Track which annotation is highlighted/centered right now

    $scope.createMode = false; // True if user is currently creating a new annotation
    $scope.newAnnotation = null; // Holds the data for a new annotation as it's being created

    $scope.editMode = false; // True if user is currently editing an annotation
    $scope.editedAnnotation = null; // Track which one is being edited right now
    $scope.editedAnnotationText = ''; // The new annotation text to be used when updating an annotation

    // Fetch uri from image table to load OpenSeadragon
    ERMrestService.getEntity().then(function(uri) {
        // Initialize OpenSeadragon with the uri
        $scope.viewerSource = uri;
    });

    // Listen for events from OpenSeadragon/iframe
    // TODO: Maybe figure out an Angular way to listen to the postMessage event
    window.addEventListener('message', function(event) {
        if (event.origin === window.location.origin) {
            var data = event.data;
            var messageType = data.messageType;
            switch (messageType) {
                case 'myAnnoReady':
                    $scope.viewerReady = data.content;
                    if ($scope.viewerReady) {
                        $scope.viewer = window.frames[0];
                        $scope.viewer.postMessage({messageType: 'annotationsList', content: $scope.annotations}, window.location.origin);
                    }
                    break;
                case 'annotationDrawn':
                    $scope.newAnnotation = {
                        description: null,
                        shape: data.content.shape
                    };
                    $scope.$apply(function() {
                        $scope.createMode = true;
                    });
                    break;
                case 'onAnnotationCreated':
                    var annotation = JSON.parse(event.data.content);
                    var coordinates = annotation.data.shapes[0].geometry;
                    ERMrestService.createAnnotation(coordinates.x, coordinates.y, coordinates.width, coordinates.height, annotation.data.context, annotation.data.text, $scope.pushAnnotationToScope);
                    break;
                default:
                    console.log('Invalid message type. No action performed.');
            }
        } else {
            console.log('Invalid event origin. Event origin: ', origin, '. Expected origin: ', window.location.origin);
        }
    });

    // A success callback fn to push new annotations into this controller's scope
    $scope.pushAnnotationToScope = function pushAnnotationToScope(newAnnotation) {
        $scope.annotations.push(newAnnotation);
    };

    $scope.highlightAnnotation = function highlightAnnotation(annotation) {
        $scope.viewer.postMessage({messageType: 'highlightAnnotation', content: annotation}, window.location.origin);
    };

    $scope.setHighlightedAnnotation = function setHighlightedAnnotation(annotationIndex) {
        $scope.highlightedAnnotation = annotationIndex;
    };

    // Activates the drawing selector tool in Annotorious
    $scope.drawAnnotation = function drawAnnotation() {
        $scope.viewer.postMessage({messageType: 'drawAnnotation'}, window.location.origin);
    };

    // Given the new annotation data, it creates the annotation in Annotorious and ERMrest
    $scope.createAnnotation = function createAnnotation(newAnnotation) {
        $scope.createMode = false;
        newAnnotation.context_uri = $scope.viewerSource;
        // Create new annotation in ERMrest
        return ERMrestService.createAnnotation(newAnnotation).then(function(response) {
            if (response.length > 0) {
                newAnnotation = response[0];
                // Send new annotation to Annotorious
                $scope.viewer.postMessage({messageType: 'createAnnotation', content: newAnnotation}, window.location.origin);
                // Add new annotation to controller scope
                $scope.annotations.push(newAnnotation);
                return newAnnotation;
            } else {
                return response;
            }
        });

        // Use constructed annotation to send a message to Annotorious
    }

    // Sets the selected annotation to edit mode
    $scope.editAnnotation = function editAnnotation(annotation) {
        $scope.editedAnnotation = annotation.id;
        $scope.editMode = true;
    };

    // Updates the annotation in Annotorious and ERMrest
    $scope.saveAnnotation = function saveAnnotation(annotation) {
        $scope.editedAnnotation = null;
        $scope.editMode = false;
        var timestamp = new Date().toISOString();
        annotation.timestamp = timestamp;
        // TODO: Jessie: Is the following line redundant? Since the input on the view is hooked up to annotation.description already..
        annotation.description = annotation.description;
        $scope.viewer.postMessage({messageType: 'updateAnnotation', content: annotation}, window.location.origin);
        ERMrestService.updateAnnotation(annotation);
    }

    $scope.deleteAnnotation = function deleteAnnotation(annotation) {
        var index = $scope.annotations.indexOf(annotation);
        $scope.annotations.splice(index, 1);
        $scope.viewer.postMessage({messageType: 'deleteAnnotation', content: annotation}, window.location.origin);
        ERMrestService.deleteAnnotation(annotation);
    };

}]);

// Trusted: A filter that tells Angular when a url is trusted =========================================================================================================================
openSeadragonApp.filter('trusted', ['$sce', function($sce) {
    return function(url) {
        return $sce.trustAsResourceUrl(url);
    };
}]);

// Refreshes page when the window's hash changes
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
