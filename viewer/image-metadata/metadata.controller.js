(function() {
    'use strict';

    angular.module('chaise.viewer')

    .controller('ImageMetadataController', ['vocabs', 'image', 'statuses', function(vocabs, image, statuses) {
        var vm = this;
        vm.image = image;
        vm.vocabs = vocabs;
        vm.statuses = statuses;

        vm.editMode = false;

        vm.edit = edit;
        vm.save = save;

        function edit() {
            vm.editMode = true;
        }

        function save() {
            vm.editMode = false;
            vm.image.entity.update();
            console.log('Updated image: ', vm.image.entity.data);
        }
    }]);
})();
