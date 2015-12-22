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

// SERVICE
// API to fetch data from ERMrest
openSeadragonApp.service('Ermrest', ['$http', function($http) {

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

    // Returns a row from rbk:image given an entity ID in URI
    this.getEntity = function getEntity() {
        var entityPath = ERMREST_ENDPOINT + this.catalogId + '/entity/' + this.schemaName + ':' + this.tableName + '/id=' + this.entityId;
        return $http.get(entityPath).then(function(response) {
            if (response.data.length > 0) {
                return response.data[0];
            } else {
                console.log('Error: ', response.status, response.statusText);
            }
        });
    };

    this.insertRoi = function insertRoi(x, y, width, height, context) {
        var timestamp = new Date().toISOString();
        var coordinates = "{" + x + ", " + y + ", " + width + ", " + height + "}";
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
        var entityPath = ERMREST_ENDPOINT + this.catalogId + '/entity/' + this.schemaName + ':roi' + '/image_id=' + this.entityId;
        return $http.get(entityPath).then(function(response) {
            if (response.status == 200) {
                if (response.data.length > 0) {
                    return response.data;
                } else {
                    console.log('No regions of interest found.');
                }
            } else {
                console.log('Error: ', response.status, response.statusText);
            }
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
        this.getRegions().then(function(regions) {
            if (regions) {
                for (var j = 0; j < regions.length; j++) {
                    var region = regions[j];
                    var regionId = region.id;
                    self.getRegionComments(regionId).then(function(comments) {
                        region.comments = comments;
                    });
                    annotations.push(region);
                }
            } else {
                return 'No regions of interest found.';
            }
        });
        return annotations;
    };
}]);


// CONTROLLER
openSeadragonApp.controller('MainController', ['$scope', 'Ermrest', function($scope, Ermrest) {
    $scope.viewerSource = '';
    $scope.annotations = [];

    // Fetch uri from image table
    Ermrest.getEntity().then(function(data) {
        // TODO: Remove me when OpenSeadragon is done! ///////
        // Splicing in my ~jessie directory in here so it redirects to my own version of OpenSeadragon and not the VM-wide version..
        data.uri = data.uri.substring(0, 34) + '~jessie/' + data.uri.substring(34);
        /////////////////////////////////////
        $scope.viewerSource = data.uri;
    });

    // After getRoi, push annotations into scope.annotations
    // And load each annotation into Annotorious
    $scope.annotations = Ermrest.getAnnotations();

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
            console.log('Error: Invalid origin for annotation data. Event origin: ', origin, ' Expected origin: ', window.location.origin);
        }
    });
}]);

// FILTERS
openSeadragonApp.filter('trusted', ['$sce', function($sce) {
    return function(url) {
        return $sce.trustAsResourceUrl(url);
    };
}]);
