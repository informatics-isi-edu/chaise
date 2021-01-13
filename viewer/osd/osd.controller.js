(function() {
    'use strict';

    angular.module('chaise.viewer')

    .controller('OSDController',
        ['AlertsService', 'context', 'DataUtils', 'errorMessages', 'image', 'logService', 'UiUtils', 'UriUtils', 'viewerAppUtils', '$window', '$rootScope','$scope', '$timeout',
        function OSDController(AlertsService, context, DataUtils, errorMessages, image, logService, UiUtils, UriUtils, viewerAppUtils, $window, $rootScope, $scope, $timeout) {

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
        $rootScope.$on("dismissEvent", function () {
            openAnnotations();
        });

        $window.addEventListener('message', function channelControllerListener(event) {
            if (event.origin === window.location.origin) {
                var data = event.data.content;
                var messageType = event.data.messageType;

                switch (messageType) {
                    case "osdLoaded":
                        $scope.$apply(function(){
                            // initialize viewer
                            if (DataUtils.isObjectAndNotNull($rootScope.osdViewerParameters)) {
                                iframe.postMessage({messageType: 'initializeViewer', content: $rootScope.osdViewerParameters}, origin);
                            }
                        });
                        break;
                    case "fetchZPlaneList":
                        $scope.$apply(function () {
                            viewerAppUtils.fetchZPlaneList(data.requestID, data.pageSize, data.before, data.after).then(function (res) {
                                iframe.postMessage({messageType: "updateZPlaneList", content: res}, origin);
                            }).catch(function (err) {
                                throw err;
                            });
                        });
                        break;
                    case "openDrawingHelpPage":
                        $window.open(UriUtils.chaiseDeploymentPath() + "help/?page=viewer-annotation", '_blank');
                        break;
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
                            AlertsService.addAlert(errorMessages.viewerScreenshotFailed, "warning");
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
            var filename = context.imageID || "image";
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
            var messageType = vm.annotationsAreHidden ? 'showAllAnnotations' : 'hideAllAnnotations';
            vm.annotationsAreHidden = !vm.annotationsAreHidden;
        }

        function openAnnotations() {
            var action = $rootScope.hideAnnotationSidebar ? logService.logActions.VIEWER_ANNOT_PANEL_SHOW : logService.logActions.VIEWER_ANNOT_PANEL_HIDE;
            $rootScope.hideAnnotationSidebar = !$rootScope.hideAnnotationSidebar;

            // app mode will change by annotation controller, this one should be independent of that
            logService.logClientAction({
                action: logService.getActionString(action, null, ""),
                stack: logService.getStackObject()
            }, $rootScope.reference.defaultLogInfo);
        }

        function filterChannels() {
            var btnptr = $('#filter-btn');
            btnptr.blur();
            var sidebarptr=$('#sidebar');

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
    }]);
})();
