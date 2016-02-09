(function() {
    'use strict';

    angular.module('chaise.viewer')

    // TODO: Remove this controller if not using it to fill in iframe
    .controller('OSDController', ['image', function OSDController(image) {
        var vm = this;
        vm.image = image;
    }]);
})();
