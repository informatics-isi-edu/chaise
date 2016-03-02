(function() {
    'use strict';

    angular.module('chaise.viewer')

    .controller('ImageMetadataController', ['AuthService', 'vocabs', 'image', 'statuses', function(AuthService, vocabs, image, statuses) {
        var vm = this;
        vm.image = image;
        vm.vocabs = vocabs;
        vm.statuses = statuses;

        vm.allowEdit = AuthService.editMetadata();

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
