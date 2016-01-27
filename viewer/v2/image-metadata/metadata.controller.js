(function() {
    'use strict';

    angular.module('chaise.viewer')

    .controller('ImageMetadataController', ['image', function(image) {
        var vm = this;
        vm.image = image;
    }]);
})();
