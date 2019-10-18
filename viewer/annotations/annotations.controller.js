(function() {
    // 'use strict';

    angular.module('chaise.viewer')

    .controller('AnnotationsController', ['AlertsService', 'anatomies', 'annotations', 'AnnotationsService', 'AuthService', 'comments', 'CommentsService', 'ConfigUtils', 'UriUtils', '$rootScope','$scope', '$timeout', '$uibModal', '$window',
        function AnnotationsController(AlertsService, anatomies, annotations, AnnotationsService, AuthService, comments, CommentsService, ConfigUtils, UriUtils, $rootScope, $scope, $timeout, $uibModal, $window) {
        var chaiseConfig = Object.assign({}, ConfigUtils.getConfigJSON());
        var vm = this;


        vm.isDisplayAll = true; // whether to show all annotations
        vm.collection = []; // annotation list
        vm.searchKeyword = "";
        vm.totalCount = 0; // total number of annotation list
        vm.selectedItem = null; // current selected annotation item
        vm.strokeScale = 1;

        vm.annotations = annotations;
        vm.anatomies = anatomies;
        vm.colors = ['red', 'orange', 'gold', 'green', 'blue', 'purple'];
        vm.defaultColor = chaiseConfig.defaultAnnotationColor || 'red';
        vm.annotationTypes = ['rectangle', 'arrow']; // 'section' excluded b/c once you set an annotation as a section, it can't be changed to other types
        vm.filterByType = {section: true, rectangle: true, arrow: true}; // show all annotation types by default

        vm.resetSearch = resetSearch;
        vm.filterAnnotations = filterAnnotations;
        vm.sortSectionsFirst = sortSectionsFirst;
        vm.setTypeVisibility = setTypeVisibility;
        vm.getNumVisibleAnnotations = getNumVisibleAnnotations;
        vm.closeAnnotations = closeAnnotations;
        vm.numVisibleAnnotations = 0;
        vm.updateAnnotationVisibility = updateAnnotationVisibility;

        vm.createMode = false;
        vm.newAnnotation = {config:{color: vm.defaultColor, visible: true}};
        vm.drawAnnotation = drawAnnotation;
        vm.createAnnotation = createAnnotation;
        vm.cancelNewAnnotation = cancelNewAnnotation;

        var originalAnnotation; // Holds the original contents of annotation in the event that a user cancels an edit
        resetEditedValues();
        vm.editAnnotation = editAnnotation;
        vm.cancelEdit = cancelEdit;
        vm.updateAnnotation = updateAnnotation;

        vm.deleteAnnotation = deleteAnnotation;

        vm.highlightedAnnotation = null;
        vm.centerAnnotation = centerAnnotation;
        vm.scrollIntoView = scrollIntoView;

        vm.getNumComments = getNumComments;
        vm.authorName = authorName;

        vm.allowCreate = AuthService.createAnnotation;
        vm.allowEdit = AuthService.editAnnotation;
        vm.allowDelete = AuthService.deleteAnnotation;


        vm.changeAllAnnotationsVisibility = changeAllAnnotationsVisibility;
        vm.addAnnotation = addAnnotation;
        vm.searchInputChanged = searchInputChanged;
        vm.clearSearch = clearSearch;
        vm.toggleDisplay = toggleDisplay;
        vm.highlightGroup = highlightGroup;
        vm.changeSelectingAnnotation = changeSelectingAnnotation;
        vm.changeStrokeScale = changeStrokeScale;

        // Listen to events of type 'message' (from Annotorious)
        $window.addEventListener('message', function annotationControllerListener(event) {
            // TODO: Check if origin is valid first; if not, return and exit.
            // Do this for the other listeners as well.
            if (event.origin === window.location.origin) {
                var data = event.data;
                var messageType = data.messageType;

                switch (messageType) {
                    case 'annotationDrawn':
                        vm.newAnnotation.shape = data.content.shape;
                        $scope.$apply(function() {
                            vm.createMode = true;
                        });
                        break;
                    case 'onClickAnnotation':
                        var content = JSON.parse(data.content);
                        //TODO check data object
                        var annotation = findAnnotation(content.shapes[0].geometry);
                        if (annotation) {
                            var annotationId = annotation.table + '-' + annotation.id;
                            $scope.$apply(function() {
                                // Highlight the annotation in the sidebar
                                vm.highlightedAnnotation = annotationId;
                            });
                            vm.scrollIntoView(annotationId);
                        }
                        break;
                    case "onClickChangeSelectingAnnotation":
                        $scope.$apply(function(){
                            var svgID = data.content.svgID,
                                groupID = data.content.groupID;

                            item = vm.collection.find(function(item){
                                return item.svgID == svgID && item.groupID == groupID;
                            })
                            vm.scrollIntoView(item.svgID + item.groupID);
                            vm.changeSelectingAnnotation(item);

                        })
                        break;
                    case "onChangeStrokeScale":
                        // console.log(data)
                        $scope.$apply(function(){
                            vm.strokeScale = +data.content.strokeScale.toFixed(2);
                        });
                        break;
                    case "updateAnnotationList":
                        $scope.$apply(function(){
                            vm.addAnnotation(data.content);
                            vm.totalCount = vm.collection.length;
                        })
                        break;
                    // The following cases are already handled elsewhere or are
                    // no longer needed but the case is repeated here to avoid
                    // triggering the default case.
                    case 'annotoriousReady': // handled in viewer.app.js.
                    case 'onHighlighted':
                    case 'onUnHighlighted':
                        break;
                    default:
                        console.log('Invalid event message type "' + messageType + '"');
                }
            } else {
                console.log('Invalid event origin. Event origin: ', event.origin, '. Expected origin: ', window.location.origin);
            }
        });

        function updateAnnotationVisibility(annotation) {
            if (vm.filterByType[annotation.type]) {
                annotation.config.visible = true;
                AnnotationsService.syncVisibility();
                vm.getNumVisibleAnnotations();
            }
        }
        function filterAnnotations(annotation) {
            if (!vm.query) {
                vm.updateAnnotationVisibility(annotation);
                return true;
            }
            vm.query = vm.query.toLowerCase();
            var author = annotation.author;
            var props = [annotation.anatomy, annotation.description, author.display_name, author.full_name, author.email, annotation.created];
            var numProps = props.length;
            for (var i = 0; i < numProps; i++) {
                if (props[i] && props[i].toLowerCase().indexOf(vm.query) > -1) {
                    vm.updateAnnotationVisibility(annotation);
                    return true;
                }
            }
            var commentsArr = comments[annotation.id];
            if (commentsArr) {
                var numComments = commentsArr.length;
                for (var c = 0; c < numComments; c++) {
                    var comment = commentsArr[c];
                    var commentAuthor = comment.author;
                    var commentProps = [comment.comment, comment.created, commentAuthor.display_name, commentAuthor.full_name, commentAuthor.email];
                    var numCommentProps = commentProps.length;
                    for (var p = 0; p < numCommentProps; p++) {
                        if (commentProps[p] && commentProps[p].toLowerCase().indexOf(vm.query) > -1) {
                            vm.updateAnnotationVisibility(annotation);
                            return true;
                        }
                    }
                }
            }
            annotation.config.visible = false;
            AnnotationsService.syncVisibility();
            vm.getNumVisibleAnnotations();
            return false;
        }

        function drawAnnotation(type) {
            vm.newAnnotation.type = type;
            return AnnotationsService.drawAnnotation();
        }

        function createAnnotation() {
            vm.createMode = false;
            AnnotationsService.createAnnotation(vm.newAnnotation).then(function success(annotation) {
                $timeout(function scrollToNewAnnotation() {
                    var annotationId = annotation.table + '-' + annotation.id;
                    vm.highlightedAnnotation = annotationId;
                    vm.scrollIntoView(annotationId);
                }, 200);
            });
            vm.newAnnotation = {config:{color: vm.defaultColor}};
        }

        function cancelNewAnnotation() {
            vm.createMode = false;
            return AnnotationsService.cancelNewAnnotation();
        }

        function editAnnotation(annotation) {
            // Must make a copy instead of assigning to remove original annotation's
            // references. Otherwise, changing something in editedAnnotation will
            // also change the original annotation.

            // This isn't a big deal except when editing the anatomy. When the anatomy
            // is edited it reorders the list of annotations before the user clicks save.
            vm.editedAnnotation = angular.copy(annotation);

            vm.editedAnnotationDomId = annotation.table + '-' + annotation.id;
            setHighlightedAnnotation(annotation);
            originalAnnotation = {
                description: annotation.description,
                anatomy: annotation.anatomy,
                config: annotation.config,
                type: annotation.type
            };
        }

        function cancelEdit(annotation) {
            annotation.description = originalAnnotation.description;
            annotation.anatomy = originalAnnotation.anatomy;
            annotation.config = originalAnnotation.config;
            annotation.type = originalAnnotation.type;
            resetEditedValues();
        }

        function updateAnnotation(annotation) {
            annotation = vm.editedAnnotation;
            AnnotationsService.updateAnnotation(annotation);
            var index = annotations.findIndex(function (_annotation){
                return _annotation.id == annotation.id;
            });
            annotations[index] = vm.editedAnnotation;
            resetEditedValues();
        }

        function resetEditedValues() {
            originalAnnotation = null;
            vm.editedAnnotation = null; // Track which annotation is being edited right now
            vm.editedAnnotationDomId = null; // Tracks the currently edited annotation's id for the dom for showing/hiding forms
        }

        function deleteAnnotation(annotation) {
            // if annotation has comments, allow it to be deleted
            if (!hasComments(annotation)) {
                if (chaiseConfig.confirmDelete == undefined || chaiseConfig.confirmDelete){
                    var modalInstance = $uibModal.open({
                        templateUrl: UriUtils.chaiseDeploymentPath() + 'common/templates/delete-link/confirm_delete.modal.html',
                        controller: 'ConfirmDeleteController',
                        controllerAs: 'ctrl',
                        size: 'sm'
                    });

                    modalInstance.result.then(function () {
                        AnnotationsService.deleteAnnotation(annotation);
                        console.log('annotation deleted');
                    }, function () {
                        console.log('Modal dismissed');
                    });
                } else {
                    AnnotationsService.deleteAnnotation(annotation);
                    console.log('annotation deleted')
                }
            } else {
                AlertsService.addAlert('Sorry, this annotation cannot be deleted because there is at least 1 comment on it. Please delete the comments before trying to delete the annotation.', 'error');
            }
        };

        function setHighlightedAnnotation(annotation) {
            vm.highlightedAnnotation = annotation.table + '-' + annotation.id;
        }

        // Centers and zooms to the annotation inside Annotorious
        function centerAnnotation(annotation) {
            setHighlightedAnnotation(annotation);
            return AnnotationsService.centerAnnotation(annotation);
        }

        // Returns boolean
        function hasComments(annotation) {
            // if there are comments return true
            return getNumComments(annotation) > 0 ? true : false;
        }

        function getNumComments(annotation) {
            return CommentsService.getNumComments(annotation.id);
        }

        // Return an annotation/section that matches an object of coordinates
        function findAnnotation(coordinates) {
            var length = vm.annotations.length;
            for (var i = 0; i < length; i++) {
                var annotationCoords = vm.annotations[i].coords;
                if (coordinates.x == annotationCoords[0] && coordinates.y == annotationCoords[1] && coordinates.width == annotationCoords[2] && coordinates.height == annotationCoords[3]) {
                    return vm.annotations[i];
                }
            }
        }

        // Scroll a DOM element into visible part of the browser
        function scrollIntoView(elementId) {
            // Using native JS b/c angular.element returns a jQuery/jqLite object,
            // which is incompatible with .scrollIntoView()
            document.getElementById(elementId).scrollIntoView({block: 'start', behavior: 'smooth'});
        }

        // Used to set the author based on the info object from the user object (user.info) that is set on every annotation
        // The info object is the session.client object and may contain a combination of display_name, full_name, and email
        function authorName(client) {
            return (client.display_name ? client.display_name : (client.full_name ? client.full_name : client.email ));
        }

        function sortSectionsFirst(annotation) {
            if (annotation.type == 'section') {
                return 0;
            }
        }

        function resetSearch() {
            vm.query = '';
        }

        // Sets all annotations of a certain type (i.e. section|rectangle|arrow) to true/false
        function setTypeVisibility(annotationType) {
            var annotations = vm.annotations;
            var visibility = vm.filterByType[annotationType];
            for (var i = 0, len = annotations.length; i < len; i++) {
                var annotation = annotations[i];
                if (annotation.type == annotationType) {
                    annotation.config.visible = visibility;
                    AnnotationsService.syncVisibility();
                    vm.getNumVisibleAnnotations();
                }
            }
        }

        function getNumVisibleAnnotations() {
            var counter = 0;
            var annotations = vm.annotations;
            for (var i = 0, len = annotations.length; i < len; i++) {
                if (annotations[i].config.visible) {
                    counter++;
                }
            }
            return vm.numVisibleAnnotations = counter;
        }

        function closeAnnotations() {
            $rootScope.$emit("dismissEvent");
        }

        // Click to toggle overlay visibility in Openseadragon
        function changeAllAnnotationsVisibility(){
            vm.isDisplayAll = !vm.isDisplayAll;
            vm.collection.forEach(function(item){
                item.isDisplay = vm.isDisplayAll;
            });
            AnnotationsService.changeAllAnnotationVisibility({
                isDisplay : vm.isDisplayAll
            })
        }

        // Change the selecting annotation item
        function changeSelectingAnnotation(item){

            if(!item){ return; }

            if(vm.selectedItem == item){
                vm.selectedItem.isSelected = false;
                vm.selectedItem = null;
            }
            else{
                if(vm.selectedItem){
                    vm.selectedItem.isSelected = false;
                }
                item.isSelected = !item.isSelected;
                vm.selectedItem = item;
            }
        }

        // Add new annotation items
        function addAnnotation(items){
            var groupID,
                i,
                name,
                ermrestID,
                svgID;

            for(i = 0; i < items.length; i++){
                groupID = items[i].groupID;
                svgID = items[i].svgID;

                /* HACK: This is done for the demo, the all ids are not available currently.
                Also the encodeURI is the same as ERMrest's _fixedEncodeURIComponent_. Since it
                is still not clear what will be th format of id.*/
                id = groupID.split(',')[0];
                encodedId = encodeURIComponent(id).replace(/[!'()*]/g, function(c) {
                    return '%' + c.charCodeAt(0).toString(16).toUpperCase();
                });
                name= groupID.split(',')[1];

                vm.collection.push({
                    groupID : groupID,
                    svgID : svgID,
                    anatomy : items[i].anatomy,
                    description : items[i].description,
                    isSelected : false,
                    isDisplay: true,
                    name: name,
                    id: id,
                    url: "/chaise/record/#2/Vocabulary:Anatomy/ID="+encodedId,
                });
            }

            // console.log("collections", vm.collection);
        }

        function searchInputChanged(){
            vm.totalCount = vm.collection.filter(function(item){
                var anatomy = item.anatomy.toLowerCase() || "",
                    keyword = vm.searchKeyword.toLowerCase();
                return anatomy.indexOf(keyword) >= 0
            }).length;
        }

        function clearSearch(){
            vm.searchKeyword = "";
            vm.totalCount = vm.collection.length;
        }

        function toggleDisplay(item, event){
            item.isDisplay = !item.isDisplay;
            AnnotationsService.changeAnnotationVisibility({
                svgID : item.svgID,
                groupID : item.groupID,
                isDisplay : item.isDisplay
            });
            
            if(event){
                event.stopPropagation();
            }
        }

        function highlightGroup(item, event){
            vm.changeSelectingAnnotation(item);
            // Unhide the annotation if it's hidden
            if(!item.isDisplay){
                vm.toggleDisplay(item);
            }
            AnnotationsService.highlightAnnotation({
                svgID : item.svgID,
                groupID : item.groupID
            });

            event.stopPropagation();
        }

        function changeStrokeScale(){
            // console.log(vm.strokeScale);
            AnnotationsService.changeStrokeScale(vm.strokeScale);
        }
    }]);
})();
