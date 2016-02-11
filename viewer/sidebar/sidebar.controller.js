(function() {
    'use strict';

    angular.module('chaise.viewer')

    .controller('SidebarController', ['image', function(image) {
        var vm = this;
        vm.image = image;
        vm.sidebars = ['annotations', 'metadata'];
        vm.sidebar = vm.sidebars[0];
        vm.setSidebar = setSidebar;
        vm.downloadView = downloadView;

        function setSidebar(sidebar) {
            vm.sidebar = sidebar;
        }

        function downloadView() {
            var iframe = document.getElementById('osd').contentWindow;
            iframe.postMessage({
                messageType: 'downloadView',
                content: {
                    outfile: vm.image.entity.data.slide_id + '.jpg'
                }
            }, window.location.origin);
        }
    }]);
})();
