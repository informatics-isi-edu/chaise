(function() {
    'use strict';

    angular.module('chaise.viewer')

    .controller('OSDController', ['image', '$window', function OSDController(image, $window) {
        var vm = this;
        var iframe = $window.frames[0];
        var origin = $window.location.origin;
        vm.image = image;
        vm.downloadView = downloadView;
        vm.zoomInView = zoomInView;
        vm.zoomOutView = zoomOutView;
        vm.homeView = homeView;

        function downloadView() {
            var filename = vm.image.entity.data.slide_id;
            if (!filename) {
                filename = 'image';
            }
            iframe.postMessage({
                messageType: 'downloadView',
                content: filename
            }, origin);
        }

        function zoomInView() {
            iframe.postMessage({messageType: 'zoomInView'}, origin);
        }

        function zoomOutView() {
            iframe.postMessage({messageType: 'zoomOutView'}, origin);
        }

        function homeView() {
            iframe.postMessage({messageType: 'homeView'}, origin);
        }
    }]);
})();
