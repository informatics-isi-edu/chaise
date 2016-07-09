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
        vm.annotationsAreHidden = false;
        vm.toggleAnnotations = toggleAnnotations;

        function downloadView() {
            var filename = vm.image.entity.slide_id;
            if (!filename) {
                filename = 'image';
            }
            var obj = {
                messageType: 'downloadView',
                content: filename
            }
            iframe.postMessage(obj, origin);
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

        function toggleAnnotations() {
            var messageType = vm.annotationsAreHidden ? 'showAllAnnotations' : 'hideAllAnnotations';
            iframe.postMessage({messageType: messageType}, origin);
            vm.annotationsAreHidden = !vm.annotationsAreHidden;
        }
    }]);
})();
