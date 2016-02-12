(function() {
    'use strict';

    angular.module('chaise.viewer')

    .controller('OSDController', ['image', function OSDController(image) {
        var vm = this;
        vm.image = image;
        vm.downloadView = downloadView;

        function downloadView() {
            var filename = vm.image.entity.data.slide_id.toString();
            if (!filename) {
                filename = 'image';
            }
            var iframe = document.getElementById('osd').contentWindow;
            iframe.postMessage({
                messageType: 'downloadView',
                content: filename
            }, window.location.origin);
        }

    }]);
})();
