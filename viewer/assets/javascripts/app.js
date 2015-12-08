var openSeadragonApp = angular.module('OpenSeadragonApp', []);

// API to fetch data from ERMrest
openSeadragonApp.service('Ermrest', ['$http', '$location', function($http, $location) {
    var ERMREST_ENDPOINT = 'http://' + $location.host() + '/ermrest/catalog/';
    if (chaiseConfig['ermrestLocation'] != null) {
        ERMREST_ENDPOINT = chaiseConfig['ermrestLocation'] + '/ermrest/catalog';
    }

    // Parse Chaise url to determine required parameters to find the requested entity
    var path = $location.path();
    var params = path.split('/');
    var catalogId = params[1];
    var schemaName = params[2].split(':')[0];
    var tableName = params[2].split(':')[1];
    var entityId = params[3].split('=')[1];

    this.getEntity = function getEntity() {
        var entityPath = ERMREST_ENDPOINT + catalogId + '/entity/' + schemaName + ':' + tableName + '/id=' + entityId;
        return $http.get(entityPath).then(function(response) {
            if (response.data.length > 0) {
                return response.data[0];
            }
        });
    }
}]);

// CONTROLLER
openSeadragonApp.controller('MainController', ['$scope', 'Ermrest', function($scope, Ermrest) {
    $scope.viewerSource = '';

    // Fetch uri from image table
    Ermrest.getEntity().then(function(data) {
        // TODO: Remove me when OpenSeadragon is done! ///////
        // https://dev.rebuildingakidney.org/openseadragon-viewer/mview.html?url=https://dev.rebuildingakidney.org/data/czi2dzi/81250cb4225cfa1fdb9730164ee224e64829700352cb78b8ee1830e1a5e21310.dzi/Brigh/ImageProperties.xml
        // Splicing in my ~jessie directory in here so it redirects to my own version of OpenSeadragon and not the VM-wide version..
        data.uri = data.uri.substring(0,34) + '~jessie/' + data.uri.substring(34);
        /////////////////////////////////////
        $scope.viewerSource = data.uri;
    });
}]);

// FILTERS
openSeadragonApp.filter('trusted', ['$sce', function($sce) {
    return function(url) {
        return $sce.trustAsResourceUrl(url);
    };
}]);
