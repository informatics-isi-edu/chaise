(function() {
    'use strict';

    angular.module('chaise.viewer')

    .controller('OSDController', ['AlertsService', 'deviceDetector', 'context', 'image', 'logService', '$window', '$rootScope','$scope', function OSDController(AlertsService, deviceDetector,context, image, logService, $window, $rootScope, $scope) {
        var vm = this;
        var iframe = $window.frames[0];
        var origin = $window.location.origin;
        vm.image = image;
        vm.downloadView = downloadView;
        vm.zoomInView = zoomInView;
        vm.zoomOutView = zoomOutView;
        vm.homeView = homeView;
        vm.alerts = AlertsService.alerts;
        var showTitle = context.queryParams.showTitle;
        if (showTitle === "true") {
            vm.showTitle = true;
        } else if (showTitle === "false") {
            vm.showTitle = false;
        } else {
            vm.showTitle = true;
        }
        vm.disablefilterChannels = false;
        vm.filterChannelsAreHidden = false;
        vm.filterChannels = filterChannels;

        vm.annotationsAreHidden = false;
        vm.toggleAnnotations = toggleAnnotations;


        // the top-left-panel that needs to be resizable with toc
        vm.resizePartners = document.querySelector(".top-left-panel");

        vm.openAnnotations = openAnnotations;
        vm.error = '';
        vm.device = deviceDetector;
        vm.isSafari = false;
        testSafari();
        vm.isRetina = false;
        testRetina();

        $rootScope.$on("dismissEvent", function () {
            openAnnotations();
        });

        $window.addEventListener('message', function channelControllerListener(event) {
            if (event.origin === window.location.origin) {
                var data = event.data;
                var messageType = data.messageType;

                switch (messageType) {
                    case "hideChannelList":
                        $scope.$apply(function(){
                          vm.filterChannelsAreHidden = !vm.filterChannelsAreHidden;
                        });
                        break;
                    case "downloadViewDone":
                        $scope.$apply(function(){
                          vm.waitingForScreenshot = false;
                        });
                        break;
                    case "downloadViewError":
                        $scope.$apply(function(){
                          vm.waitingForScreenshot = false;
                          AlertsService.addAlert("Couldn't process the screenshot.", "warning");
                        });
                        break;
                    default:
                        // other messages are handled by other controllers
                }
            } else {
                console.log('Invalid event origin. Event origin: ', event.origin, '. Expected origin: ', window.location.origin);
            }
        });

        function downloadView() {
            var filename = context.imageID;
            if (!filename) {
                filename = 'image';
            }
            var obj = {
                messageType: 'downloadView',
                content: filename
            }

            vm.waitingForScreenshot = true;
            iframe.postMessage(obj, origin);

            // app mode will change by annotation controller, this one should be independent of that
            logService.logClientAction({
                action: logService.getActionString(logService.logActions.VIEWER_SCREENSHOT, null, ""),
                stack: logService.getStackObject()
            }, $rootScope.reference.defaultLogInfo);
        }

        function zoomInView() {
            iframe.postMessage({messageType: 'zoomInView'}, origin);

            // app mode will change by annotation controller, this one should be independent of that
            logService.logClientAction({
                action: logService.getActionString(logService.logActions.VIEWER_ZOOM_IN, null, ""),
                stack: logService.getStackObject()
            }, $rootScope.reference.defaultLogInfo);
        }

        function zoomOutView() {
            iframe.postMessage({messageType: 'zoomOutView'}, origin);

            // app mode will change by annotation controller, this one should be independent of that
            logService.logClientAction({
                action: logService.getActionString(logService.logActions.VIEWER_ZOOM_OUT, null, ""),
                stack: logService.getStackObject()
            }, $rootScope.reference.defaultLogInfo);
        }

        function homeView() {
            iframe.postMessage({messageType: 'homeView'}, origin);

            // app mode will change by annotation controller, this one should be independent of that
            logService.logClientAction({
                action: logService.getActionString(logService.logActions.VIEWER_ZOOM_RESET, null, ""),
                stack: logService.getStackObject()
            }, $rootScope.reference.defaultLogInfo);
        }

        function toggleAnnotations() {
            var btnptr = $('#hide-btn');
            btnptr.blur();
//            event.currentTarget.blur();
            var messageType = vm.annotationsAreHidden ? 'showAllAnnotations' : 'hideAllAnnotations';
            // iframe.postMessage({messageType: messageType}, origin);
            vm.annotationsAreHidden = !vm.annotationsAreHidden;
        }

        function openAnnotations() {
            var btnptr = $('#edit-btn');
            btnptr.blur();
            // var panelptr=$('#annotations-panel');
            var sidebarptr=$('#sidebar');
            if($rootScope.hideAnnotationSidebar) {
              // if(!vm.filterChannelsAreHidden) { // close channels
              //   filterChannels();
              // }
              sidebarptr.css("display","block");

              // panelptr.removeClass('fade-out').addClass('fade-in');
              } else {
                sidebarptr.css("display","none");
            }
            // iframe.postMessage({messageType: 'openAnnotations'}, origin);

            var action = $rootScope.hideAnnotationSidebar ? logService.logActions.VIEWER_ANNOT_PANEL_SHOW : logService.logActions.VIEWER_ANNOT_PANEL_HIDE;
            $rootScope.hideAnnotationSidebar = !$rootScope.hideAnnotationSidebar;

            // app mode will change by annotation controller, this one should be independent of that
            logService.logClientAction({
                action: logService.getActionString(action, null, ""),
                stack: logService.getStackObject()
            }, $rootScope.reference.defaultLogInfo);
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

            // if(vm.filterChannelsAreHidden) {
            //   if(!vm.hideAnnotationSidebar) { // annotation is up
                // openAnnotations(); // close it
            //   }
            //   if(covered())
                //   sidebarptr.css("display","none");
            // }

            var action = vm.filterChannelsAreHidden ? logService.logActions.VIEWER_CHANNEL_HIDE : logService.logActions.VIEWER_CHANNEL_SHOW;

            iframe.postMessage({messageType: 'filterChannels'}, origin);
            vm.filterChannelsAreHidden = !vm.filterChannelsAreHidden;

            // log the click
            // app mode will change by annotation controller, this one should be independent of that
            logService.logClientAction({
                action: logService.getActionString(action, null, ""),
                stack: logService.getStackObject()
            }, $rootScope.reference.defaultLogInfo);
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
