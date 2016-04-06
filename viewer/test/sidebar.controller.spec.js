'use strict';

describe('SidebarController', function() {
    var $controller;

    beforeEach(function() {
        angular.mock.module('chaise.viewer');
        inject(function(_$controller_) {
            $controller = _$controller_;
        });
    });

    it('setSidebar() should set the sidebar', function() {
        var controller = $controller('SidebarController');
        expect(controller.sidebar).toEqual(controller.sidebars[0]);
        controller.setSidebar('exampleSidebar');
        expect(controller.sidebar).toEqual('exampleSidebar');
    });

    it('should have at least one sidebar', function() {
        var controller = $controller('SidebarController');
        expect(controller.sidebars.length).toBeGreaterThan(0);
    });
});
