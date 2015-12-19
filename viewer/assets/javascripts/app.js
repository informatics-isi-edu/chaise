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
    var path = window.location.hash;
    var params = path.split('/');
    var catalogId = params[0].substring(1);
    var schemaName = params[1].split(':')[0];
    var tableName = params[1].split(':')[1];
    var entityId = params[2].split('=')[1];

    var ERMREST_ENDPOINT = window.location.origin + '/ermrest/catalog/';
    if (chaiseConfig['ermrestLocation'] != null) {
        ERMREST_ENDPOINT = chaiseConfig['ermrestLocation'] + '/ermrest/catalog';
    }

    // Returns a row from rbk:image given an entity ID in URI
    this.getEntity = function getEntity() {
        var entityPath = ERMREST_ENDPOINT + catalogId + '/entity/' + schemaName + ':' + tableName + '/id=' + entityId;
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
            "image_id": parseInt(entityId),
            "author": null,
            "timestamp": timestamp,
            "coords": coordinates,
            "context_uri": context,
            "anatomy": null
        }];
        var entityPath = ERMREST_ENDPOINT + catalogId + '/entity/' + schemaName + ':roi?defaults=id,author';
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

        var entityPath = ERMREST_ENDPOINT + catalogId + '/entity/' + schemaName + ':roi_comment?defaults=id,author';
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
}]);

// CONTROLLER
openSeadragonApp.controller('MainController', ['$scope', 'Ermrest', function($scope, Ermrest) {
    $scope.viewerSource = '';
    $scope.annotations = [];

    // Fetch uri from image table
    Ermrest.getEntity().then(function(data) {
        // TODO: Remove me when OpenSeadragon is done! ///////
        // https://dev.rebuildingakidney.org/openseadragon-viewer/mview.html?url=https://dev.rebuildingakidney.org/data/czi2dzi/81250cb4225cfa1fdb9730164ee224e64829700352cb78b8ee1830e1a5e21310.dzi/Brigh/ImageProperties.xml
        // Splicing in my ~jessie directory in here so it redirects to my own version of OpenSeadragon and not the VM-wide version..
        data.uri = data.uri.substring(0, 34) + '~jessie/' + data.uri.substring(34);
        /////////////////////////////////////
        $scope.viewerSource = data.uri;
    });

    // TODO: Figure out an Angular way to listen to the postMessage event
    $(window).on('message', function(event) {
        var origin = event.originalEvent.source;
        // TODO: Abstract away rebuildingakidney url
        if (origin === 'http://dev.rebuildingakidney.org') {
            var annotation = JSON.parse(event.originalEvent.data);
            var coordinates = annotation.data.shapes[0].geometry;
            // Inserts annotation data into rbk:roi and rbk:roi_comment
            Ermrest.createAnnotation(coordinates.x, coordinates.y, coordinates.width, coordinates.height, annotation.data.context, annotation.data.text);
        } else {
            console.log('Error: Invalid origin for annotation data.');
        }
    });
}]);

// FILTERS
openSeadragonApp.filter('trusted', ['$sce', function($sce) {
    return function(url) {
        return $sce.trustAsResourceUrl(url);
    };
}]);
