(function() {
    'use strict';

    angular.module('chaise.viewer')

    .controller('OSDController', ['image', function OSDController(image) {
        var vm = this;
        vm.image = image;
        vm.template = 'osd/osd.html';
    }]);
})();
