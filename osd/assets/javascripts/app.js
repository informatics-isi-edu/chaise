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
        $scope.viewerSource = data.uri;
    });
}]);

// FILTERS
openSeadragonApp.filter('trusted', ['$sce', function($sce) {
    return function(url) {
        return $sce.trustAsResourceUrl(url);
    };
}]);
