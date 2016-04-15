(function() {
    'use strict';

    angular.module('chaise.viewer')

    .controller('AnnotationsController', ['AuthService', 'annotations', 'sections', 'anatomies', 'AnnotationsService', '$window', '$scope', function AnnotationsController(AuthService, annotations, sections, anatomies, AnnotationsService, $window, $scope) {
        var vm = this;
        vm.annotations = annotations;
        vm.sections = sections;
        vm.anatomies = anatomies;
        vm.arrowColors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];

        vm.filterAnnotations = filterAnnotations;

        vm.createMode = false;
        vm.newAnnotation = {config:{}};
        vm.newAnnotationType = null;
        vm.drawAnnotation = drawAnnotation;
        vm.createAnnotation = createAnnotation;
        vm.cancelNewAnnotation = cancelNewAnnotation;

        vm.editedAnnotation = null; // Track which annotation is being edited right now; used to show/hide the right UI elements depending on which one is being edited.
        var originalAnnotation = null; // Holds the original contents of annotation in the event that a user cancels an edit
        vm.editAnnotation = editAnnotation;
        vm.cancelEdit = cancelEdit;
        vm.updateAnnotation = updateAnnotation;

        vm.deleteAnnotation = deleteAnnotation;

        vm.highlightedAnnotation = null;
        vm.centerAnnotation = centerAnnotation;

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
                        var content = JSON.parse(data.content);
                        var annotation = findAnnotation(content.data.shapes[0].geometry);
                        if (annotation) {
                            $scope.$apply(function() {
                                // Highlight the annotation in the sidebar
                                vm.highlightedAnnotation = annotation.table.name + '-' + annotation.data.id;
                            });
                        }
                        break;
                    case 'onUnHighlighted':
                        $scope.$apply(function() {
                            vm.highlightedAnnotation = null;
                        });
                        break;
                    case 'onClickAnnotation':
                        var content = JSON.parse(data.content);
                        var annotation = findAnnotation(content.data.shapes[0].geometry);
                        if (annotation) {
                            var annotationId = annotation.table.name + '-' + annotation.data.id;
                            $scope.$apply(function() {
                                vm.highlightedAnnotation = annotationId;
                            });
                            scrollIntoView(annotationId);
                        }
                        break;
                    default:
                        console.log('Invalid event message type "' + messageType + '"');
                }
            } else {
                console.log('Invalid event origin. Event origin: ', event.origin, '. Expected origin: ', window.location.origin);
            }
        });

        // Returns true if at least one of a specified subset of an object's keys contains a value that contains the query
        function filterAnnotations(keys) {
            var query = vm.query;
            return function(annotation) {
                if (!query) {
                    // If query is "" or undefined, then the annotation is considered a match
                    return true;
                }
                annotation = annotation.data;
                query = query.toLowerCase();

                // Loop through the array to find matches
                var numKeys = keys.length;
                if (numKeys > 0) {
                    for (var i = 0; i < numKeys; i++) {
                        if (annotation[keys[i]].toLowerCase().indexOf(query) !== -1) {
                            return true;
                        }
                    }
                }
                return false;
            }
        }

        function drawAnnotation(type) {
            vm.newAnnotation.type = type;
            return AnnotationsService.drawAnnotation();
        }

        function createAnnotation() {
            console.log('Controller:', vm.newAnnotation);
            vm.createMode = false;
            AnnotationsService.createAnnotation(vm.newAnnotation);
            vm.newAnnotation = {config:{}};
            vm.newAnnotationType = null;
        }

        function cancelNewAnnotation() {
            vm.createMode = false;
            return AnnotationsService.cancelNewAnnotation();
        }

        function editAnnotation(annotation) {
            vm.editedAnnotation = annotation.table.name + '-' + annotation.data.id;
            originalAnnotation = {
                description: annotation.data.description,
                anatomy: annotation.data.anatomy
            };
        };

        function cancelEdit(annotation) {
            vm.editedAnnotation = null;
            var data = annotation.data;
            data.description = originalAnnotation.description;
            data.anatomy = originalAnnotation.anatomy;
        };

        function updateAnnotation(annotation) {
            vm.editedAnnotation = null;
            return AnnotationsService.updateAnnotation(annotation);
        }

        function deleteAnnotation(annotation) {
            return AnnotationsService.deleteAnnotation(annotation);
        };

        function setHighlightedAnnotation(annotation) {
            vm.highlightedAnnotation = annotation.table.name + '-' + annotation.data.id;
        }

        // Centers and zooms to the annotation inside Annotorious
        function centerAnnotation(annotation) {
            setHighlightedAnnotation(annotation);
            return AnnotationsService.centerAnnotation(annotation);
        }

        function getNumComments(annotation) {
            return AnnotationsService.getNumComments(annotation.data.id);
        }

        // Return an annotation/section that matches an object of coordinates
        function findAnnotation(coordinates) {
            // Search in annotations collection
            for (var i = 0; i < vm.annotations.length; i++) {
                var annotationCoords = vm.annotations[i].data.coords;
                if (coordinates.x == annotationCoords[0] && coordinates.y == annotationCoords[1] && coordinates.width == annotationCoords[2] && coordinates.height == annotationCoords[3]) {
                    return vm.annotations[i];
                }
            }
            // Search in sections collection
            for (var i = 0; i < vm.sections.length; i++) {
                var annotationCoords = vm.sections[i].data.coords;
                if (coordinates.x == annotationCoords[0] && coordinates.y == annotationCoords[1] && coordinates.width == annotationCoords[2] && coordinates.height == annotationCoords[3]) {
                    return vm.sections[i];
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
    }]);
})();
