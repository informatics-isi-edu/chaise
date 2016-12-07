(function() {
    'use strict';

    angular.module('chaise.viewer')

    .controller('OSDController', ['image', '$window', function OSDController(image, $window) {
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

        function toggleAnnotations(event) {
            event.currentTarget.blur();
            var messageType = vm.annotationsAreHidden ? 'showAllAnnotations' : 'hideAllAnnotations';
            iframe.postMessage({messageType: messageType}, origin);
            var btnptr = $('#hide-btn');
/*
            if(vm.annotationsAreHidden) {
              btnptr.removeClass('pick');
              } else {
                btnptr.addClass('pick');
            }
*/
            vm.annotationsAreHidden = !vm.annotationsAreHidden;
        }

        function openAnnotations(event) {
            event.currentTarget.blur();
            var btnptr = $('#edit-btn');
            var panelptr=$('#annotations-panel');
            var sidebarptr=$('#sidebar');
            if(vm.annotationsSidebarAreHidden) {
              if(!vm.filterChannelsAreHidden) { // close channels
                filterChannels();
              }
              sidebarptr.css("display","");
//              btnptr.addClass('pick');
              panelptr.removeClass('fade-out').addClass('fade-in');
              } else {
 //               btnptr.removeClass('pick');
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

        function filterChannels(event) {
            event.currentTarget.blur();
            var btnptr = $('#filter-btn');
            var sidebarptr=$('#sidebar');
  
            if(vm.filterChannelsAreHidden) {
//              btnptr.addclass('pick');
              if(!vm.annotationsSidebarAreHidden) { // annotation is up
                openAnnotations(); // close it
              }
              if(covered())
                  sidebarptr.css("display","none");
              } else {
//                btnptr.removeClass('pick');
            }
            iframe.postMessage({messageType: 'filterChannels'}, origin);
            vm.filterChannelsAreHidden = !vm.filterChannelsAreHidden;
        }
    }]);
})();
