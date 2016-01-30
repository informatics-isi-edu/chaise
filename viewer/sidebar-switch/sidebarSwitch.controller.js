(function() {
    'use strict';

    angular.module('chaise.viewer')

    .controller('SidebarSwitchController', [function() {
        var vm = this;
        vm.sidebars = ['annotations', 'metadata'];
        vm.sidebar = vm.sidebars[0];
        vm.setSidebar = setSidebar;

        function setSidebar(sidebar) {
            vm.sidebar = sidebar;
        }
    }]);
})();
