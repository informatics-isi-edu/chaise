var openSeadragonApp = angular.module('OpenSeadragonApp', []);

// API to fetch data from ERMrest
openSeadragonApp.service('Ermrest', ['$http', '$location', function($http, $location) {
    this.getEntity = function getEntityURI(catalogId, schemaName, tableName, entityId) {
        var entityPath = 'http://' + $location.host() + '/ermrest/catalog/' + catalogId + '/entity/' + schemaName + ':' + tableName + '/id=' + entityId;
        return $http.get(entityPath).then(function(response) {
            if (response.data.length > 0) {
                return response.data[0];
            }
        });
    }
}]);

// CONTROLLER
openSeadragonApp.controller('MainController', ['$scope', 'Ermrest', function($scope, Ermrest) {
    var catalogId = 1;
    var entityId = 44;
    var schemaName = 'rbk';
    var tableName = 'image';
    $scope.viewerSource = '';

    Ermrest.getEntity(catalogId, schemaName, tableName, entityId).then(function(data) {
        $scope.viewerSource = data.uri;
    });
}]);

// FILTERS
openSeadragonApp.filter('trusted', ['$sce', function($sce) {
    return function(url) {
        return $sce.trustAsResourceUrl(url);
    };
}]);
