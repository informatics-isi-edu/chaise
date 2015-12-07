var openSeadragonApp = angular.module('openSeadragonApp', []);

openSeadragonApp.controller('MainCtrl', ['$scope', '$sce', function($scope, $sce) {
    $scope.entity = true;
    $scope.viewerSource = $sce.trustAsResourceUrl('http://vm-dev-030.misd.isi.edu/~jessie/openseadragon-viewer/mview.html?url=http://vm-dev-030.misd.isi.edu/~mei/data/real3/DZC/DAPI/ImageProperties.xml&url=http://vm-dev-030.misd.isi.edu/~mei/data/real3/DZC/Alexa%20Fluor%20488/ImageProperties.xml&url=http://vm-dev-030.misd.isi.edu/~mei/data/real3/DZC/Alexa%20Fluor%20555/ImageProperties.xml&url=http://vm-dev-030.misd.isi.edu/~mei/data/real3/DZI/ImageProperties.xml&x=0.5&y=0.6452489905787349&z=0.45868459229311215');
}]);
