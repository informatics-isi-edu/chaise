(function() {
    'use strict';

    angular.module('chaise.viewer')

    .controller('ViewerController',
        ['AlertsService', 'context', 'DataUtils', 'errorMessages', 'Errors', 'ErrorService', 'logService', 'messageMap', 'UiUtils', 'UriUtils', 'viewerAppUtils', '$window', '$rootScope','$scope', '$timeout',
        function (AlertsService, context, DataUtils, errorMessages, Errors, ErrorService, logService, messageMap, UiUtils, UriUtils, viewerAppUtils, $window, $rootScope, $scope, $timeout) {

        var vm = this;
        var iframe = $window.frames[0];
        var origin = $window.location.origin;
        vm.downloadView = downloadView;
        vm.zoomInView = zoomInView;
        vm.zoomOutView = zoomOutView;
        vm.homeView = homeView;
        vm.alerts = AlertsService.alerts;
        vm.showChannelList = false;
        vm.toggleChannelList = toggleChannelList;

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
                            viewerAppUtils.fetchZPlaneList(data.requestID, data.pageSize, data.before, data.after, data.reloadCauses).then(function (res) {
                                iframe.postMessage({messageType: "updateZPlaneList", content: res}, origin);
                            }).catch(function (err) {
                                throw err;
                            });
                        });
                        break;
                    // TODO change this to a better name
                    case "fetchZPlaneListByZIndex":
                        $scope.$apply(function () {
                            viewerAppUtils.fetchZPlaneListByZIndex(data.requestID, data.pageSize, data.zIndex, data.source).then(function (res) {
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
                            vm.showChannelList = false;
                        });
                        break;
                    case "showChannelList":
                        $scope.$apply(function(){
                            vm.showChannelList = true;
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
                    case "updateDefaultZIndex":
                        $scope.$apply(function () {
                            viewerAppUtils.updateDefaultZIndex(data.zIndex).then(function (res) {
                                // we don't need to do anything on success.
                                // the alerts are disaplyed by the updateDefaultZIndex function
                            }).catch(function (error) {
                                throw error;
                            }).finally(function () {
                                // let osd viewer know that the process is done
                                iframe.postMessage({ messageType: "updateDefaultZIndexDone", content: { 'zIndex': data.zIndex}}, origin);
                            })
                        });
                        break;
                    case "updateChannelConfig":
                        $scope.$apply(function () {
                            viewerAppUtils.updateChannelConfig(data).then(function (res) {
                                // the alerts are disaplyed by the updateChannelConfig function
                                // let osd viewer know that the process is done
                                iframe.postMessage({ messageType: "updateChannelConfigDone", content: {channels: data, success: res}}, origin);
                            }).catch(function (error) {
                                // let osd viewer know that the process is done
                                iframe.postMessage({ messageType: "updateChannelConfigDone", content: {channels: data, success: false}}, origin);

                                // show the error
                                throw error;
                            });
                        });
                        break;
                    case "showAlert":
                        $scope.$apply(function(){
                            AlertsService.addAlert(data.message, data.type);
                        });
                        break;
                    case "showPopupError":
                        $scope.$apply(function(){
                            var clickActionMessage = data.clickActionMessage;
                            if (data.isDismissible && !DataUtils.isNoneEmptyString(clickActionMessage)) {
                                clickActionMessage = messageMap.clickActionMessage.dismissDialog
                            }
                            var err = new Errors.CustomError(data.header, data.message, null, clickActionMessage, data.isDismissible);
                            ErrorService.handleException(err, data.isDismissible, true);
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

        function openAnnotations() {
            var action = $rootScope.hideAnnotationSidebar ? logService.logActions.VIEWER_ANNOT_PANEL_SHOW : logService.logActions.VIEWER_ANNOT_PANEL_HIDE;
            $rootScope.hideAnnotationSidebar = !$rootScope.hideAnnotationSidebar;

            // app mode will change by annotation controller, this one should be independent of that
            logService.logClientAction({
                action: logService.getActionString(action, null, ""),
                stack: logService.getStackObject()
            }, $rootScope.reference.defaultLogInfo);
        }

        function toggleChannelList() {
            var action = vm.showChannelList ? logService.logActions.VIEWER_CHANNEL_HIDE : logService.logActions.VIEWER_CHANNEL_SHOW;

            iframe.postMessage({messageType: 'toggleChannelList'}, origin);
            vm.showChannelList = !vm.showChannelList;

            // log the click
            // app mode will change by annotation controller, this one should be independent of that
            logService.logClientAction({
                action: logService.getActionString(action, null, ""),
                stack: logService.getStackObject()
            }, $rootScope.reference.defaultLogInfo);
        }
    }]);
})();
