(function() {
    'use strict';

    angular.module('chaise.viewer')

    .controller('ImageMetadataController', ['image', function(image) {
        var vm = this;
        vm.image = image;
        vm.description = false;
        vm.accession_number = false;
        vm.doi = false;
        vm.ark = false;
        vm.edit = edit;

        function edit(key) {
            vm[key] = !vm[key];
            if (!vm[key]) {
                vm.image[0].data.uri = vm.image[0].data.uri.replace(/\/~jessie/g, '');
                vm.image[0].update();
            }
        }
    }]);
})();
