(function() {
    'use strict';

    angular.module('chaise.viewer')

    .controller('OSDController', ['image', '$window', function OSDController(image, $window) {
        var vm = this;
        vm.image = image;
    }]);
})();
