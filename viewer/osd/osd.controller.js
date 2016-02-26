(function() {
    'use strict';

    angular.module('chaise.viewer')

    .controller('OSDController', ['image', function OSDController(image) {
        var vm = this;
        var iframe = document.getElementById('osd').contentWindow;
        var origin = window.location.origin;
        vm.image = image;
        vm.downloadView = downloadView;
        vm.zoomInView = zoomInView;
        vm.zoomOutView = zoomOutView;
        vm.homeView = homeView;

        function downloadView() {
            var filename = vm.image.entity.data.slide_id.toString();
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
