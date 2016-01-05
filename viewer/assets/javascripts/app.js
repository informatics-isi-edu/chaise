var openSeadragonApp = angular.module('openSeadragonApp', []);
// Refreshes page when fragment identifier changes
setTimeout(function(){

    window.onhashchange = function() {

        if (window.location.hash != '#undefined') {
            location.reload();
        } else {
            history.pushState("", document.title, window.location.pathname);
            location.reload();
        }

        function goBack() {
            window.location.hash = window.location.lasthash[window.location.lasthash.length-1];
            window.location.lasthash.pop();
        }
    }
}, 0);

openSeadragonApp.factory('ERMrestClientFactory', ['$http', '$q', function($http, $q) {
    ERMrest.configure($http, $q);
    return ERMrest.clientFactory;
}]);

// SERVICE
// API to fetch data from ERMrest
openSeadragonApp.service('Ermrest', ['ERMrestClientFactory', '$http', function(ERMrestClientFactory, $http) {
    var client = ERMrestClientFactory.getClient('https://dev.rebuildingakidney.org/ermrest', null);
    var catalog = client.getCatalog(1);

    // Get a reference to the Ermrest service
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

    this.createAnnotation = function createAnnotation(x, y, width, height, context, comment) {
        // First create a row in rbk:roi...
        this.insertRoi(x, y, width, height, context).then(function(response) {
            if (response.data) {
                return response.data[0];
            } else {
                return 'Error: Region of interest could not be created. ' + response.status + ' ' + response.statusText;
            }
        // Then create a row in roi_comment, filling in the roi_id column with the result of insertRoi()
        }).then(function(data) {
            var roiId = data.id;
            self.insertRoiComment(roiId, comment).then(function(response) {
                if (response.data) {
                    return response.data[0];
                } else {
                    return 'Error: Comment could not be created. ' + response.status + ' ' + response.statusText;
                }
            });
        });
    };

    this.getRegions = function getRegions() {
        return this.getSchema().then(function(schema) {
            var roiTable = schema.getTable('roi');
            var filteredRoiTable = roiTable.getFilteredTable(["image_id=" + self.entityId]);
            filteredRoiTable.getRows().then(function(rows) {
                if (rows.length > 0) {
                    console.log(rows);
                    return rows;
                } else {
                    return 'No regions of interest found.';
                }
            });
        });
    };

    this.getRegionComments = function getRegionComments(roiId) {
        var entityPath = ERMREST_ENDPOINT + this.catalogId + '/entity/' + this.schemaName + ':roi_comment' + '/roi_id=' + roiId;
        return $http.get(entityPath).then(function(response) {
            if (response.status == 200) {
                if (response.data.length > 0) {
                    return response.data;
                } else {
                    console.log('No comments found.');
                    return;
                }
            } else {
                return 'Error: ' + response.status + ' ' + response.statusText;
            }
        });
    };

    this.getAnnotations = function getAnnotations() {
        var annotations = [];
        this.getSchema().then(function(schema) {
            var roiTable = schema.getTable('roi');
            var filteredRoiTable = roiTable.getFilteredTable(["image_id=" + self.entityId]);
            return filteredRoiTable.getRows().then(function(roiRows) {
                if (roiRows.length > 0) {
                    return Promise.all(roiRows.map(function(roi) {
                        return roi.getRelatedTable(self.schemaName, 'roi_comment').getRows().then(function(commentRows) {
                            return Promise.all(commentRows.map(function(comment) {
                                roi.data.comments = comment.data.comment;
                                annotations.push(roi);
                            }));
                        });
                    }));
                } else {
                    return 'No annotations found.';
                }
            });
        });
        return annotations;
    };
}]);

// CONTROLLER
openSeadragonApp.controller('MainController', ['$scope', 'Ermrest', 'ERMrestClientFactory', function($scope, Ermrest, ERMrestClientFactory) {
    $scope.annotations = [];
    $scope.viewerSource = null;
    $scope.viewerWindow = null;

    // $scope.$watch('viewerSource', function() {
    //     setTimeout(function waitForViewerToLoad() {
    //         // setTimeout() used to queue this assignment to the end,
    //         // which avoids $scope.viewer from being assigned before iframe is finished loading
    //         // TODO: Isn't there a better way to do this w/o setTimeout?
    //         // if (angular.element(document.getElementById('viewer'))[0]) {
    //             // $scope.viewerWindow = angular.element(document.getElementById('viewer'))[0].contentWindow;
    //             $scope.viewerWindow = window.frames[0];
    //         // }
    //     }, 0);
    // });
    //
    // $scope.$watch('viewerWindow', function() {
    //     if ($scope.viewerWindow) {
    //         console.log('viewerWindow changed and not null!');
    //         console.log('viewerWindow is currently: ', $scope.viewerWindow);
    //         $scope.viewerWindow.postMessage('a dummy message', window.location.origin);
    //         console.log('I posted the message!');
    //     }
    // });

    // setInterval(function() {
    //     $scope.viewerWindow.postMessage('a dummy message', window.location.origin);
    //     console.log('interval ran');
    // }, 5000);

    // Fetch uri from image table to load OpenSeadragon
    Ermrest.getEntity().then(function(data) {
        // TODO: Remove me after pushing to vm-wide version of OpenSeadragon ///////////////
        // Splicing in my ~jessie directory in here so it redirects to my own version of OpenSeadragon and not the VM-wide version..
        data = data.substring(0, 34) + '~jessie/' + data.substring(34);
        ///////////////////////////////////////////////////////////////////////////////////
        $scope.viewerSource = data;
    });

    // Push pre-existing annotations in Ermrest into controller's scope
    $scope.annotations = Ermrest.getAnnotations();
    // TODO: Load each annotation into Annotorious and redraw annotations.

    // Listen for events from OpenSeadragon/iframe
    // TODO: Figure out an Angular way to listen to the postMessage event
    $(window).on('message', function(event) {
        var origin = event.originalEvent.origin;
        // TODO: Abstract away rebuildingakidney url
        if (origin === window.location.origin) {
            var annotation = JSON.parse(event.originalEvent.data);
            var coordinates = annotation.data.shapes[0].geometry;
            // Inserts annotation data into rbk:roi and rbk:roi_comment
            Ermrest.createAnnotation(coordinates.x, coordinates.y, coordinates.width, coordinates.height, annotation.data.context, annotation.data.text);
        } else {
            console.log('Error: Invalid origin for annotation data. Event origin: ', origin, '. Expected origin: ', window.location.origin);
        }
    });
}]);

// FILTERS
openSeadragonApp.filter('trusted', ['$sce', function($sce) {
    return function(url) {
        return $sce.trustAsResourceUrl(url);
    };
}]);
