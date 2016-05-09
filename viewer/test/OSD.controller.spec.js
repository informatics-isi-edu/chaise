'use strict';

// TODO: refactor these tests
describe('OSDController', function() {
    var $controller, controller;

    beforeEach(function() {
        angular.mock.module('chaise.viewer');
        inject(function(_$controller_) {
            $controller = _$controller_;
        });
        controller = $controller('OSDController');
        var iframe = document.createElement('iframe');
        iframe.src = 'https://dev.rebuildingakidney.org/openseadragon-viewer/mview.html?url=https://dev.rebuildingakidney.org/data/8f270ec5386a13fd25bec89f8ef5efe2ba8d072d4b90f621f6193a7e804475c6/Brigh/ImageProperties.xml';
        document.body.appendChild(iframe);
    });

    afterEach(function() {
        var iframe = document.getElementsByTagName('iframe')[0];
        document.body.removeChild(iframe);
    });

    it('should define a downloadView() method', function() {
        expect(controller.downloadView).toBeDefined();
        expect(controller.downloadView).toEqual(jasmine.any(Function));
    });

// Test with pending() is skipped for now
    it("should use the slide id, if known, for the screenshot's filename", function() {
        pending();
        var iframe = document.getElementsByTagName('iframe')[0].contentWindow;

        controller.image.entity.slide_id = 'test123';
        iframe.addEventListener('message', function captureEvent(event) {
            console.log(event);
            event = event.data;
            expect(event.messageType).toEqual('downloadView');
            expect(event.content).toEqual('test123');
        });
        controller.downloadView();
    });

    // Test with pending() is skipped for now
    it("should use 'image' as the default screenshot's filename", function() {
        pending();
        var iframe = document.getElementsByTagName('iframe')[0].contentWindow;

        controller.image.entity.slide_id = null;
        iframe.addEventListener('message', function captureEvent(event) {
            event = event.data;
            expect(event.messageType).toEqual('downloadView');
            expect(event.content).toEqual('image');
        });
        controller.downloadView();
    });

    it('should define a zoomInView() method', function() {
        expect(controller.zoomInView).toBeDefined();
        expect(controller.zoomInView).toEqual(jasmine.any(Function));
    });

    it('should define a zoomOutView() method', function() {
        expect(controller.zoomOutView).toBeDefined();
        expect(controller.zoomOutView).toEqual(jasmine.any(Function));
    });

    it('should define a homeView() method', function() {
        expect(controller.homeView).toBeDefined();
        expect(controller.homeView).toEqual(jasmine.any(Function));
    });
});
