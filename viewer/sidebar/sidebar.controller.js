(function() {
    'use strict';

    angular.module('chaise.viewer')

    .controller('SidebarController', [function() {
        var vm = this;
        vm.sidebars = ['annotations', 'metadata'];
        vm.sidebar = vm.sidebars[0];
        vm.setSidebar = setSidebar;

        function setSidebar(sidebar) {
            vm.sidebar = sidebar;
        }
    }]);
})();
