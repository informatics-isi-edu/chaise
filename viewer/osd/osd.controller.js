(function() {
    'use strict';

    angular.module('chaise.viewer')

    .controller('OSDController', ['deviceDetector', 'image', '$window', '$rootScope', function OSDController(deviceDetector, image, $window, $rootScope) {
        var vm = this;
        var iframe = $window.frames[0];
        var origin = $window.location.origin;
        vm.image = image;
        vm.downloadView = downloadView;
        vm.zoomInView = zoomInView;
        vm.zoomOutView = zoomOutView;
        vm.homeView = homeView;

        vm.filterChannelsAreHidden = true;
        vm.filterChannels = filterChannels;

        vm.annotationsAreHidden = false;
        vm.toggleAnnotations = toggleAnnotations;

        vm.annotationsSidebarAreHidden = true;
        vm.openAnnotations = openAnnotations;

        vm.device = deviceDetector;
        vm.isSafari = false;
        testSafari();
        vm.isRetina = false;
        testRetina();

        $rootScope.$on("dismissEvent", function () {
            openAnnotations();
        });

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
            var btnptr = $('#hide-btn');
            btnptr.blur();
//            event.currentTarget.blur();
            var messageType = vm.annotationsAreHidden ? 'showAllAnnotations' : 'hideAllAnnotations';
            iframe.postMessage({messageType: messageType}, origin);
            vm.annotationsAreHidden = !vm.annotationsAreHidden;
        }

        function openAnnotations() {
            var btnptr = $('#edit-btn');
            btnptr.blur();
            var panelptr=$('#annotations-panel');
            var sidebarptr=$('#sidebar');
            if(vm.annotationsSidebarAreHidden) {
              if(!vm.filterChannelsAreHidden) { // close channels
                filterChannels();
              }
              sidebarptr.css("display","");
              panelptr.removeClass('fade-out').addClass('fade-in');
              } else {
                panelptr.removeClass('fade-in').addClass('fade-out');
            }
            vm.annotationsSidebarAreHidden = !vm.annotationsSidebarAreHidden;
        }

        function covered() {
            var sidebarptr=$('#sidebar');
            var covered=false;
            var tmp=sidebarptr.css("display");
            if(tmp && tmp!='none')
              covered=true;
            return covered;
        }

        function filterChannels() {
            var btnptr = $('#filter-btn');
            btnptr.blur();
            var sidebarptr=$('#sidebar');
  
            if(vm.filterChannelsAreHidden) {
              if(!vm.annotationsSidebarAreHidden) { // annotation is up
                openAnnotations(); // close it
              }
              if(covered())
                  sidebarptr.css("display","none");
            }
            iframe.postMessage({messageType: 'filterChannels'}, origin);
            vm.filterChannelsAreHidden = !vm.filterChannelsAreHidden;
        }

        function testSafari() {
//            var deviceData = JSON.stringify(vm.device, null, 2);
            var browser=vm.device.browser;
            if(browser=='safari') {
               vm.isSafari = true;
               } else {
                   vm.isSafari = false;
            }
        }
        function testRetina() {
//https://coderwall.com/p/q2z2uw/detect-hidpi-retina-displays-in-javascript
            var mediaQuery = "(-webkit-min-device-pixel-ratio: 1.5),\
                               (min--moz-device-pixel-ratio: 1.5),\
                               (-o-min-device-pixel-ratio: 3/2),\
                               (min-resolution: 1.5dppx)";

            if ((window.devicePixelRatio > 1) || 
                 (window.matchMedia && window.matchMedia(mediaQuery).matches)) {
                vm.isRetina=true;
            }
        }
    }]);
})();
