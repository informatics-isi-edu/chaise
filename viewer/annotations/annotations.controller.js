(function() {
    'use strict';

    angular.module('chaise.viewer')

    .controller('AnnotationsController', ['AuthService', 'annotations', 'comments', 'anatomies', 'AnnotationsService', 'CommentsService', '$window', '$scope', '$timeout', '$uibModal', 'AlertsService', function AnnotationsController(AuthService, annotations, comments, anatomies, AnnotationsService, CommentsService, $window, $scope, $timeout, $uibModal, AlertsService) {
        var vm = this;
        vm.annotations = annotations;
        vm.anatomies = anatomies;
        vm.colors = ['red', 'orange', 'gold', 'green', 'blue', 'purple'];
        vm.defaultColor = chaiseConfig.defaultAnnotationColor || 'red';
        vm.annotationTypes = ['rectangle', 'arrow']; // 'section' excluded b/c once you set an annotation as a section, it can't be changed to other types
        vm.filterByType = {section: true, rectangle: true, arrow: true}; // show all annotation types by default

        vm.filterAnnotations = filterAnnotations;
        vm.sortSectionsFirst = sortSectionsFirst;

        vm.createMode = false;
        vm.newAnnotation = {config:{color: vm.defaultColor}};
        vm.drawAnnotation = drawAnnotation;
        vm.createAnnotation = createAnnotation;
        vm.cancelNewAnnotation = cancelNewAnnotation;

        vm.editedAnnotation = null; // Track which annotation is being edited right now
        var originalAnnotation = null; // Holds the original contents of annotation in the event that a user cancels an edit
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

        // Listen to events of type 'message' (from Annotorious)
        $window.addEventListener('message', function annotationControllerListener(event) {
            // TODO: Check if origin is valid first; if not, return and exit.
            // Do this for the other listeners as well.
            if (event.origin === window.location.origin) {
                var data = event.data;
                var messageType = data.messageType;

                switch (messageType) {
                    case 'annotoriousReady':
                        // annotoriousReady case handled in viewer.app.js.
                        // Repeating the case here to avoid triggering default case
                        break;
                    case 'annotationDrawn':
                        vm.newAnnotation.shape = data.content.shape;
                        $scope.$apply(function() {
                            vm.createMode = true;
                        });
                        break;
                    case 'onHighlighted':
                    // On-hover highlighting behavior no longer needed
                    // OSD still sends this message out on hover though, so the
                    // is case here to avoid triggering default case
                        break;
                    case 'onUnHighlighted':
                    // On-hover highlighting behavior no longer needed
                    // OSD still sends this message out on hover though, so the
                    // is case here to avoid triggering default case
                        break;
                    case 'onClickAnnotation':
                        var content = JSON.parse(data.content);
                        //TODO check data object
                        var annotation = findAnnotation(content.data.shapes[0].geometry);
                        if (annotation) {
                            var annotationId = annotation.table + '-' + annotation.id;
                            $scope.$apply(function() {
                                // Highlight the annotation in the sidebar
                                vm.highlightedAnnotation = annotationId;
                            });
                            vm.scrollIntoView(annotationId);
                        }
                        break;
                    default:
                        console.log('Invalid event message type "' + messageType + '"');
                }
            } else {
                console.log('Invalid event origin. Event origin: ', event.origin, '. Expected origin: ', window.location.origin);
            }
        });

        function filterAnnotations(annotation) {
            if (!vm.query) {
                return true;
            }

            vm.query = vm.query.toLowerCase();

            var author = annotation.author;
            var props = [annotation.anatomy, annotation.description, author.display_name, author.full_name, author.email, annotation.created];
            var numProps = props.length;
            for (var i = 0; i < numProps; i++) {
                if (props[i] && props[i].toLowerCase().indexOf(vm.query) > -1) {
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
                            return true;
                        }
                    }
                }
            }

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
            vm.editedAnnotation = angular.copy(annotation);

            vm.editedAnnotation.domId = annotation.table + '-' + annotation.id;
            setHighlightedAnnotation(annotation);
            originalAnnotation = {
                description: annotation.description,
                anatomy: annotation.anatomy,
                config: annotation.config,
                type: annotation.type
            };
        }

        function cancelEdit(annotation) {
            vm.editedAnnotation = null;
            // TODO @howdyjessie What is the point of the following code
            var data = annotation;
            data.description = originalAnnotation.description;
            data.anatomy = originalAnnotation.anatomy;
            data.config = originalAnnotation.config;
            data.type = originalAnnotation.type;
        }

//TODO check data
        function updateAnnotation(annotation) {
            annotation.data = vm.editedAnnotation.data;
            AnnotationsService.updateAnnotation(annotation);
            vm.editedAnnotation = null;
        }

        function deleteAnnotation(annotation) {
            // if annotation has comments, allow it to be deleted
            if (!hasComments(annotation)) {
                if (chaiseConfig.confirmDelete == undefined || chaiseConfig.confirmDelete){
                    var modalInstance = $uibModal.open({
                        templateUrl: 'annotations/confirm_delete.html',
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
                AlertsService.addAlert({
                    type: 'error',
                    message: 'Sorry, this annotation cannot be deleted because there is at least 1 comment on it. Please delete the comments before trying to delete the annotation.'
                });
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

        function getNumComments(annotation) {
            return CommentsService.getNumComments(annotation.id);
        }

        // Returns boolean
        function hasComments(annotation) {
            // if there are comments return true
            return getNumComments(annotation) > 0 ? true : false;
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
            document.getElementById(elementId).scrollIntoView({
                block: 'start',
                behavior: 'smooth'
            });
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
    }]);
})();
