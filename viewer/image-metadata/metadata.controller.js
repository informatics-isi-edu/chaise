(function() {
    'use strict';

    angular.module('chaise.viewer')

    .controller('ImageMetadataController', ['vocabs', 'image', 'statuses', function(vocabs, image, statuses) {
        var vm = this;
        vm.image = image;
        vm.vocabs = vocabs;
        vm.statuses = statuses;

        // List of keys inside the image object that are editable. Initialized
        // as false to indicate that they're not in edit mode.
        vm.editingStatus = false;
        vm.editingDescription = false;
        vm.editingAccessionNum = false;
        vm.editingDOI = false;
        vm.editingARK = false;
        vm.editingTissue = false;
        vm.editingAgeStage = false;
        vm.editingEmbeddingMedium = false;
        vm.editingGender = false;
        vm.editingSpecimenFixation = false;
        vm.editingStainingProtocol = false;

        vm.edit = edit;
        vm.save = save;

        function edit(key) {
            vm[key] = true;
        }

        function save(key) {
            vm[key] = false;
            vm.image.entity.update();
            console.log('Updated image: ', vm.image.entity.data);
        }
    }]);
})();
