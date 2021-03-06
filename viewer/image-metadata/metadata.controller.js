(function() {
    'use strict';

    angular.module('chaise.viewer')

    .controller('ImageMetadataController', ['AlertsService', 'AuthService', 'vocabs', 'image', 'statuses', 'context', function(AlertsService, AuthService, vocabs, image, statuses, context) {
        var vm = this;
        vm.image = image;
        vm.vocabs = vocabs;
        vm.statuses = statuses;

        vm.allowEdit = AuthService.editMetadata;

        vm.editMode = false;

        vm.edit = edit;
        vm.save = save;

        function edit() {
            vm.editMode = true;
        }

        function save() {
            vm.editMode = false;

            var table = context.schema.tables.get(context.tableName);
            var imageArr = [];
            imageArr.push(vm.image.entity);
            table.entity.put(imageArr).then(null, function error(response){
                AlertsService.addAlert('Your image data was not updated', 'error');
                console.log(response);
            });
        }
    }]);
})();
