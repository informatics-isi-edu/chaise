// openSeadragonApp: Defines the Angular application ==================================================================================================================================
var openSeadragonApp = angular.module('openSeadragonApp', ['ERMrest']);

// ERMrestService: A service for operations that deal with the ERMrest db =============================================================================================================
openSeadragonApp.service('ERMrestService', ['ermrestClientFactory', '$http', function(ermrestClientFactory, $http) {
    // Get a reference to the ERMrestService service
    var self = this;

    // Parse Chaise url to determine required parameters to find the requested entity
    this.path = window.location.hash;
    this.params = this.path.split('/');
    this.catalogId = this.params[0].substring(1);
    this.schemaName = this.params[1].split(':')[0];
    this.tableName = this.params[1].split(':')[1];
    this.entityId = this.params[2].split('=')[1];

    // The name of the table where the annotations are stored — currently 'roi'
    this.annotationTableName = 'annotation';
    this.anatomyTableName = 'anatomy';

    var ERMREST_ENDPOINT = window.location.origin + '/ermrest/catalog/';
    if (chaiseConfig['ermrestLocation'] != null) {
        ERMREST_ENDPOINT = chaiseConfig['ermrestLocation'] + '/ermrest/catalog';
    }

    var client = ermrestClientFactory.getClient(window.location.origin + '/ermrest', null);
    var catalog = client.getCatalog(1);

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
            return filteredTable.getEntities().then(function(rows) {
                return rows[0].data.uri;
            });
        });
    };

    this.createAnnotation = function createAnnotation(annotation) {
        if (annotation.anatomy === "") {
            annotation.anatomy = null;
        }
        annotation = [{
            "image_id": self.entityId,
            "anatomy": annotation.anatomy,
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
            var table = schema.getTable(self.annotationTableName);
            return table.createEntity(annotation, ['id', 'author', 'created']).then(function(response) {
                return response;
            });
        });
    };

    this.updateAnnotation = function updateAnnotation(annotation) {
        if (annotation.anatomy === "") {
            annotation.anatomy = null;
        }

        var editedAnnotation = [{
            "id": annotation.id,
            "image_id": self.entityId,
            "author": annotation.author,
            "created": annotation.created,
            "context_uri": annotation.context_uri,
            "coords": annotation.coords,
            "description": annotation.description,
            "anatomy": annotation.anatomy
        }];
        var entityPath = ERMREST_ENDPOINT + this.catalogId + '/entity/' + this.schemaName + ':' + this.annotationTableName;
        return $http.put(entityPath, editedAnnotation);
    };

    this.getAnnotations = function getAnnotations() {
        var annotations = [];
        this.getSchema().then(function(schema) {
            var table = schema.getTable(self.annotationTableName);
            var filteredTable = table.getFilteredTable(["image_id=" + self.entityId]);
            return filteredTable.getEntities().then(function(rows) {
                if (rows.length > 0) {
                    return Promise.all(rows.map(function(row) {
                        annotations.push(row.data);
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
            var table = schema.getTable(self.annotationTableName);
            var filteredTable = table.getFilteredTable(["id=" + annotation.id]);
            return filteredTable.getEntities().then(function(rows) {
                rows[0].delete();
            });
        });
    };

    this.getAnatomies = function getAnatomies() {
        var anatomies = [];
        this.getSchema().then(function(schema) {
            var table = schema.getTable(self.anatomyTableName);
            table.getEntities().then(function(rows) {
                if (rows.length > 0) {
                    return Promise.all(rows.map(function(row) {
                        anatomies.push(row.data.term);
                    }));
                } else {
                    return rows;
                }
            });
        });
        return anatomies;
    };
}]);


// MainController: An Angular controller to update the view ===========================================================================================================================
openSeadragonApp.controller('MainController', ['$scope', '$window', 'ERMrestService', function($scope, $window, ERMrestService) {
    $scope.annotations = ERMrestService.getAnnotations(); // An array of annotation objects
    $scope.anatomies = ERMrestService.getAnatomies(); // An array of anatomy terms
    $scope.viewerSource = null; // The source URL of the iframe/viewer
    $scope.viewerReady = false; // True if viewer (OpenSeadragon/Annotorious) has finished setup
    $scope.viewer = null; // A reference to the iframe window

    $scope.highlightedAnnotation = null; // Track which annotation is highlighted/centered right now

    $scope.createMode = false; // True if user is currently creating a new annotation
    $scope.newAnnotation = null; // Holds the data for a new annotation as it's being created

    $scope.editedAnnotation = null; // Track which annotation is being edited right now; used to show/hide the right UI elements depending on which one is being edited.
    $scope.originalAnnotation = null; // Holds the original contents of annotation in the event that a user cancels an edit

    // Fetch uri from image table to load OpenSeadragon
    ERMrestService.getEntity().then(function(uri) {
        // TODO: Remove me after pushing to vm-wide version of OpenSeadragon ///////////////
        // Splicing in my ~jessie directory in here so it redirects to my own version of OpenSeadragon and not the VM-wide version..
        uri = uri.substring(0, 34) + '~jessie/' + uri.substring(34);
        ///////////////////////////////////////////////////////////////////////////////////
        // Initialize OpenSeadragon with the uri
        $scope.viewerSource = uri;
    });

    // Listen for events from OpenSeadragon/iframe
    $window.addEventListener('message', function(event) {
        if (event.origin === window.location.origin) {
            var data = event.data;
            var messageType = data.messageType;
            switch (messageType) {
                case 'annotoriousReady':
                    $scope.viewerReady = data.content;
                    if ($scope.viewerReady) {
                        $scope.viewer = window.frames[0];
                        $scope.viewer.postMessage({messageType: 'loadAnnotations', content: $scope.annotations}, window.location.origin);
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
                    $scope.focusForm();
                    break;
                default:
                    console.log('Invalid message type. No action performed.');
            }
        } else {
            console.log('Invalid event origin. Event origin: ', origin, '. Expected origin: ', window.location.origin);
        }
    });

    $scope.setHighlightedAnnotation = function setHighlightedAnnotation(annotationId) {
        $scope.highlightedAnnotation = annotationId;
    };

    $scope.highlightAnnotation = function highlightAnnotation(annotation) {
        $scope.viewer.postMessage({messageType: 'highlightAnnotation', content: annotation}, window.location.origin);
    };

    // Activates the drawing selector tool in Annotorious
    $scope.drawAnnotation = function drawAnnotation() {
        $scope.viewer.postMessage({messageType: 'drawAnnotation'}, window.location.origin);
    };

    // Focuses the description field when the annotation creation form is activated
    $scope.focusForm = function focusForm() {
        document.getElementById('create-annotation-form').getElementsByClassName('description-field')[0].focus();
    };

    // Stop creating an annotation: Hides the forms used to create an annotation in Chaise and Annotorious
    $scope.cancelAnnotationCreation = function cancelAnnotationCreation() {
        $scope.createMode = false;
        $scope.viewer.postMessage({messageType: 'cancelAnnotationCreation'}, window.location.origin);
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
                $scope.newAnnotation = null;
                return newAnnotation;
            } else {
                return response;
            }
        });
    }

    // Sets the selected annotation to edit mode
    $scope.editAnnotation = function editAnnotation(annotation) {
        $scope.editedAnnotation = annotation.id;
        $scope.originalAnnotation = annotation;
    };

    // Stop editing an annotation
    $scope.cancelAnnotationEdit = function cancelAnnotationEdit(annotation) {
        $scope.editedAnnotation = null;
        annotation = $scope.originalAnnotation;
    };

    // Given the updated annotation data, it updates the annotation in Annotorious and ERMrest
    $scope.saveAnnotation = function saveAnnotation(annotation) {
        $scope.editedAnnotation = null;
        $scope.viewer.postMessage({messageType: 'updateAnnotation', content: annotation}, window.location.origin);
        ERMrestService.updateAnnotation(annotation);
    }

    $scope.deleteAnnotation = function deleteAnnotation(annotation) {
        var index = $scope.annotations.indexOf(annotation);
        $scope.annotations.splice(index, 1);
        $scope.viewer.postMessage({messageType: 'deleteAnnotation', content: annotation}, window.location.origin);
        ERMrestService.deleteAnnotation(annotation);
    };

    // Returns true if at least one of a specified subset of an object's keys contains a value that contains the query
    // Arguments: query = the string to find matches; keys = an array of object keys to filter through on the object
    $scope.filterAnnotations = function filterAnnotations(query, keys) {
        return function(annotation) {
            if (!query) {
                // If query is "" or undefined, then the annotation is considered a match
                return true;
            } else {
                query = query.toLowerCase();
                // If the "anatomy" key is null, make it "No Anatomy" so that a query for "No Anatomy" will match this key
                if (!annotation.anatomy) {
                    annotation.anatomy = 'No Anatomy';
                }
                // Loop through the array to find matches
                var numKeys = keys.length;
                if (numKeys > 0) {
                    for (var i = 0; i < numKeys; i++) {
                        if (annotation[keys[i]].toLowerCase().indexOf(query) !== -1) {
                            return true;
                        }
                    }
                }
                // Set the "anatomy" key back to null if it was changed to "No Anatomy" earlier
                if (annotation.anatomy === 'No Anatomy') {
                    annotation.anatomy = null;
                }
            }
        }
    }
}]);


// Filters ============================================================================================================================================================================
// Trusted: A filter that tells Angular when a url is trusted
openSeadragonApp.filter('trusted', ['$sce', function($sce) {
    return function(url) {
        return $sce.trustAsResourceUrl(url);
    };
}]);

// Capitalize: A filter that capitalizes the first character for each word in a string
openSeadragonApp.filter('capitalize', function() {
    return function(input, all) {
        var regex = (all) ? /([^\W_]+[^\s-]*) */g : /([^\W_]+[^\s-]*)/;
        return (!!input) ? input.replace(regex, function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }) : '';
    }
});

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
