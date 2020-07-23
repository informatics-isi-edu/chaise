(function() {
    // 'use strict';

    angular.module('chaise.viewer')

    .controller('AnnotationsController', ['AlertsService', 'annotationCreateForm', 'annotationEditForm', 'annotations','AnnotationsService', 'AuthService', 'comments', 'context', 'CommentsService', 'ConfigUtils', 'DataUtils', 'InputUtils', 'UriUtils', 'modalUtils', 'modalBox', 'recordsetDisplayModes', 'recordCreate', 'logService', 'annotationModels', '$q', '$rootScope','$scope', '$timeout', '$uibModal', '$window', 'viewerConstant',
    function AnnotationsController(AlertsService, annotationCreateForm, annotationEditForm, annotations,AnnotationsService, AuthService, comments, context, CommentsService, ConfigUtils, DataUtils, InputUtils, UriUtils, modalUtils , modalBox,recordsetDisplayModes, recordCreate, logService, annotationModels, $q, $rootScope, $scope, $timeout, $uibModal, $window, viewerConstant) {

        var chaiseConfig = Object.assign({}, ConfigUtils.getConfigJSON());
        var annotConstant = viewerConstant.annotation;
        var idColName = annotConstant.ANNOTATED_TERM_ID_COLUMN_NAME,
            nameColName = annotConstant.ANNOTATED_TERM_NAME_COLUMN_NAME
        var vm = this;

        vm.annotationCreateForm = annotationCreateForm;
        vm.annotationEditForm = annotationEditForm;
        vm.viewerConstant = viewerConstant;
        vm.annotations = annotations;
        vm.colors = ['red', 'orange', 'gold', 'green', 'blue', 'purple'];
        vm.defaultColor = chaiseConfig.defaultAnnotationColor || 'red';
        vm.annotationTypes = ['rectangle', 'arrow']; // 'section' excluded b/c once you set an annotation as a section, it can't be changed to other types
        vm.filterByType = {section: true, rectangle: true, arrow: true}; // show all annotation types by default

        vm.filterAnnotations = filterAnnotations;
        vm.getNumVisibleAnnotations = getNumVisibleAnnotations;
        vm.closeAnnotations = closeAnnotations;
        vm.numVisibleAnnotations = 0;
        vm.updateAnnotationVisibility = updateAnnotationVisibility;

        vm.createMode = false; // TODO not used
        vm.newAnnotation = {config:{color: vm.defaultColor, visible: true}}; // TODO not used
        // vm.drawAnnotation = drawAnnotation;
        vm.createAnnotation = createAnnotation; // TODO not used
        vm.cancelNewAnnotation = cancelNewAnnotation; // TODO not used

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

        /**
         * features added to support new annotation features
         * **/
        vm.annotationModels = annotationModels; // model that contains antaomy's annotations
        vm.showPanel = false; // whether to show annotation metadata panel
        vm.isDisplayAll = true; // whether to show all annotations
        vm.searchKeyword = ""; // search keyword
        vm.totalCount = 0; // total number of annotation list
        vm.matchCount = 0; // number of filtered annotations
        vm.selectedItem = null; // current selected annotation item
        vm.strokeScale = 1; // stroke size of the annotation
        // TODO  the following should be renamed evnetually (we're editing annotation not anatomy)
        vm.editingAnatomy = null; // current setting anatomy from annotationModels
        vm.editingAnatomyIndex = null;
        vm.onSearchPopupValueChange = onSearchPopupValueChange; // if anatomy changed, we should do some updates
        vm.getAnnotatedTermDisabledTuples = getAnnotatedTermDisabledTuples; // disable the existing anatomy, in the popup
        vm.displayDrawingRequiredError = false;
        vm.annotationFormPendingResult = false;

        vm.addNewTerm = addNewTerm;
        vm.changeAllAnnotationsVisibility = changeAllAnnotationsVisibility;
        vm.changeStrokeScale = changeStrokeScale;
        vm.changeSelectingAnnotation = changeSelectingAnnotation;
        vm.clearSearch = clearSearch;
        vm.closeAnnotationForm = closeAnnotationForm;
        vm.drawAnnotation = drawAnnotation;
        vm.editAnatomyAnnotations = editAnatomyAnnotations;
        vm.highlightGroup = highlightGroup;
        vm.removeAnnotationEntry = removeAnnotationEntry;
        vm.search = search;
        vm.saveAnatomySVGFile = saveAnatomySVGFile;
        vm.saveAnnotationRecord = saveAnnotationRecord;
        vm.toggleDisplay = toggleDisplay;
        vm.updateDisplayNum = updateDisplayNum;

        // Listen to events of type 'message' (from Annotorious)
        $window.addEventListener('message', function annotationControllerListener(event) {
            // TODO: Check if origin is valid first; if not, return and exit.
            // Do this for the other listeners as well.
            if (event.origin === window.location.origin) {
                var data = event.data;
                var messageType = data.messageType;
                // console.log("event received : ", event);
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

                            item = vm.annotationModels.find(function(item){
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
                            console.log("here");
                            _addAnnotationToList(data.content);
                            vm.updateDisplayNum();
                        })
                        break;
                    case "saveGroupSVGContent":
                        $scope.$apply(function(){
                            console.log("save svg files");
                            vm.saveAnatomySVGFile(data);
                        })
                        break;
                    // The following cases are already handled elsewhere or are
                    // no longer needed but the case is repeated here to avoid
                    // triggering the default case.
                    case 'annotoriousReady': // handled in viewer.app.js.
                    case 'onHighlighted':
                    case 'onUnHighlighted':
                        break;
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

        // TODO not used
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

        // TODO not used
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

        /**
         * Add new annotation items
         * This function will be called after osd viewer is done processing the svgs,
         * it will return a list of items that should be presented in the annotation list
         */
        function _addAnnotationToList(items){
            var groupID,
                i,
                svgID,
                row,
                obj;

            // HACK: For mapping the id of human anatomy
            // mouse id vs human id... (one is used in the url, the other in the svg file)
            var dict = {
              "EHDAA2:0028494": "EMAPA:27697",
              "EHDAA2:0027681": "EMAPA:27681",
              "EHDAA2:0027605": "EMAPA:27605",
              "EHDAA2:0027678": "EMAPA:27678",
              "EHDAA2:0027621": "EMAPA:27621",
              "EHDAA2:0018679": "EMAPA:18679"
            };
            for(i = 0; i < items.length; i++){
                groupID = items[i].groupID;
                svgID = items[i].svgID;

                // TODO why osd viewer is sending this event?
                if(svgID === "NEW_SVG" || groupID === "NEW_GROUP"){
                    continue;
                }

                // TODO how can this happen? does it makes sense?
                if(vm.annotationModels.find(function (item) { return item.groupID === groupID})){
                    continue;
                }

                /* HACK: This is done for the demo, the all ids are not available currently.
                Also the encodeURI is the same as ERMrest's _fixedEncodeURIComponent_. Since it
                is still not clear what will be th format of id.*/
                var metadata = groupID.split(',');
                var name, ermrestID, id;
                if (metadata.length == 1) {
                  if (metadata[0].indexOf(':') !== -1) {
                    id = dict[metadata[0]] ? dict[metadata[0]] : metadata[0];
                  } else {
                    name = metadata[0];
                  }
                } else {
                  for (var j = 0; j < metadata.length ; j++ ){
                    if (metadata[j].indexOf(':') !== -1) {
                      id = dict[metadata[j]] ? dict[metadata[j]] : metadata[j];
                    } else {
                      name = metadata[j];
                    }
                  }
                }

                var url = "/chaise/record/#" + context.catalogID;
                url += "/" + UriUtils.fixedEncodeURIComponent(annotConstant.ANNOTATED_TERM_TABLE_SCHEMA_NAME) + ":" + UriUtils.fixedEncodeURIComponent(annotConstant.ANNOTATED_TERM_TABLE_NAME);
                url += "/" + UriUtils.fixedEncodeURIComponent(annotConstant.ANNOTATED_TERM_ID_COLUMN_NAME) + "=" + UriUtils.fixedEncodeURIComponent(id);

                // default values for new anatomy's annotation
                obj = {
                    groupID : groupID,
                    svgID : svgID,
                    anatomy : items[i].anatomy,
                    description : items[i].description,
                    isSelected : false,
                    isDrawing : false,
                    isDisplay: true,
                    isNew : false,
                    isStoredInDB: false,
                    isShow : true,
                    name: name,
                    id: id,
                    url: url,
                    tuple: null
                };

                row = $rootScope.annotationTuples.find(function (tuple, index) {
                    return tuple.data && tuple.data[annotConstant.ANNOTATED_TERM_COLUMN_NAME] === id;
                });

                // if row with same anatomy id exists in the viewer model -> update it
                if(row){
                    obj.isStoredInDB = true;
                    obj.tuple = row;
                }

                vm.annotationModels.push(obj);

            }
        }

        // Add new anatomy to the list
        function addNewTerm(){
            var newAnnotation = {
                svgID : "NEW_SVG",
                groupID : "NEW_GROUP",
                anatomy : "",
                description : "",
                isSelected : false,
                isDrawing : false,
                isDisplay: true,
                isNew : true,
                isStoredInDB: true,
                name: null,
                id: null,
                url: null,
                tuple: null
            };

            // TODO is this unnecessary?
            annotationCreateForm.rows = [{}];
            annotationCreateForm.submissionRows = [{}];
            annotationCreateForm.foreignKeyData = [{}];
            annotationCreateForm.oldRows = [{}];

            recordCreate.populateCreateModelValues(annotationCreateForm, annotationCreateForm.reference);

            // Set it to show the setting panel
            vm.editAnatomyAnnotations(newAnnotation);

            // Notify OSD to create a new svg and group for annotations
            AnnotationsService.addNewTerm({
                svgID : "NEW_SVG",
                groupID : "NEW_GROUP",
                anatomy : "",
                description : ""
            });
            
            AlertsService.deleteAllAlerts();

        }

        // Click to toggle overlay visibility in Openseadragon
        function changeAllAnnotationsVisibility(){
            vm.isDisplayAll = !vm.isDisplayAll;
            vm.annotationModels.forEach(function(item){
                item.isDisplay = vm.isDisplayAll;
            });
            AnnotationsService.changeAllAnnotationVisibility({
                isDisplay : vm.isDisplayAll
            })
        }

        // Change the selecting anatomy's item
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

        // Notify openseadragon to change stroke width
        function changeStrokeScale(){
            AnnotationsService.changeStrokeScale(vm.strokeScale);
        }

        /**
         * This function is called after each foreignkey value change in annotation form.
         * The purpose of this callback is to do
         *  - Make sure the selected annotated term is unique in the list of annotations.
         *  - Signal OSD to change the groupID and svgID of drawing
         */
        function onSearchPopupValueChange(columnModel, tuple) {
            if (columnModel.column.name !== annotConstant.ANNOTATED_TERM_VISIBLE_COLUMN_NAME) {
                return true;
            }

            var item = vm.editingAnatomy,
                data = tuple.data;

            // allow itself to be selected
            if (data[idColName] !== item.id) {
                // manually make sure the ID doesn't exist in the list,
                // because some of the annotations might not be stored in the database
                if(vm.annotationModels.find(function (row) { return row.id === data[idColName]})){
                    return {error: true, message: "An annotation already exists for this Anatomy, please select other terms."};
                }
            }

            // Update the new Anatomy name and ID at openseadragon viewer
            AnnotationsService.changeGroupInfo({
                svgID : item.svgID,
                groupID : item.groupID,
                newGroupID : data[idColName] + "," + data[nameColName],
                newAnatomy : data[nameColName] + " (" + data[idColName] + ")"
            });

            // TODO should be part of a prototype (this is done twice)
            var url = "/chaise/record/#" + context.catalogID;
            url += "/" + UriUtils.fixedEncodeURIComponent(annotConstant.ANNOTATED_TERM_TABLE_SCHEMA_NAME) + ":" + UriUtils.fixedEncodeURIComponent(annotConstant.ANNOTATED_TERM_TABLE_NAME);
            url += "/" + UriUtils.fixedEncodeURIComponent(annotConstant.ANNOTATED_TERM_ID_COLUMN_NAME) + "=" + UriUtils.fixedEncodeURIComponent(data[idColName]);

            item["groupID"] = data[idColName] + "," + data[nameColName];
            item["name"] = data[nameColName];
            item["id"] = data[idColName];
            item["url"] = url;
            return true;
        }

        /**
         * This function is used for all the foreignkey columns presented in the annotation form,
         * but the only purpose of this is to actually return a function for just the annotated term (anatomy).
         * This will disable the rows that already exist in the database. 
         *
         * The displayed table (in the popup) is the annotated table, and we want to disable
         * rows from this table that already have the combination of Image in database.
         * So we start from the anotated term and add a filter based on the image value
         * that is in the annotation table.
         * TODO might be able to refactor this, it's the same as the one in recordCreate
         */
        function getAnnotatedTermDisabledTuples (columnModel) {
            if (columnModel.column.name !== annotConstant.ANNOTATED_TERM_VISIBLE_COLUMN_NAME) {
                return null;
            }

            return function (tableModel, page, requestCauses, reloadStartTime) {
                var defer = $q.defer();
                var disabledRows = [], index, newStack = tableModel.logStack, pageSize = tableModel.pageLimit;

                var action = logService.logActions.LOAD;
                if (Array.isArray(requestCauses) && requestCauses.length > 0) {
                    action = logService.logActions.RELOAD;
                    newStack = logService.addCausesToStack(tableModel.logStack, requestCauses, reloadStartTime);
                }
                var logObj = {
                    action: logService.getActionString(action, tableModel.logStackPath),
                    stack: newStack
                }

                var facet = {};
                 // TODO should be done in ermrestjs
                 var existingRefURL = context.serviceURL + "/catalog/" + context.catalogID + "/entity/";
                 existingRefURL += UriUtils.fixedEncodeURIComponent(annotConstant.ANNOTATED_TERM_TABLE_SCHEMA_NAME) + ":";
                 existingRefURL += UriUtils.fixedEncodeURIComponent(annotConstant.ANNOTATED_TERM_TABLE_NAME) + "/";

                facet.choices = [context.imageID];
                facet.source = [{"inbound": annotConstant.ANNOTATED_TERM_FOREIGN_KEY_CONSTRAINT}];
                facet.source.push(annotConstant.REFERENCE_IMAGE_COLUMN_NAME);
                existingRefURL += "*::facets::" + ERMrest.encodeFacet({and: [facet]});

                ERMrest.resolve(existingRefURL, ConfigUtils.getContextHeaderParams()).then(function (ref) {
                    // TODO properly pass logObj
                    return ref.setSamePaging(page).read(pageSize, logObj, false, true);
                }).then(function (newPage) {
                    newPage.tuples.forEach(function (newTuple) {
                        // currently selected value should not be disabled
                        if (vm.editingAnatomy.id === newTuple.data[idColName]) {
                            return;
                        }
                        index = page.tuples.findIndex(function (tuple) {
                            return tuple.uniqueId == newTuple.uniqueId;
                        });
                        if (index > -1) disabledRows.push(page.tuples[index]);
                    });

                    defer.resolve({disabledRows: disabledRows, page: page});
                }).catch(function (err) {
                    defer.reject(err);
                });

                return defer.promise;
            }
        }

        // Clear search term from the input
        function clearSearch(){
            vm.searchKeyword = "";
            updateDisplayNum();
        }

        /**
         * Close the annotation metadata panel
         */
        function closeAnnotationForm(){

            vm.annoForm.$setPristine();
            vm.annoForm.$setUntouched();

            var item = vm.editingAnatomy;

            // Close the drawing tool if opened
            if(item && item.isDrawing){
                item.isDrawing = false;
                AnnotationsService.drawAnnotation({
                    svgID : item.svgID,
                    groupID : item.groupID,
                    mode : (item.isDrawing) ? "ON" : "OFF"
                });
            };

            /**
             * if the current setting anatomy is still unsaved when closing the panel
             * remove the drawing from openseadragon
             */
            if(item.svgID === "NEW_SVG" || item.groupID === "NEW_GROUP"){
                // Remove the new created svg and group if not saved
                AnnotationsService.removeSVG({svgID : item.svgID});
            }

            // Set editing item to null to hide the metadata panel
            vm.editAnatomyAnnotations(null);
        }

        /**
         * Click to open drawing tool for anatomy's annotations
         * @param {object} item : the anatomy's annotations object
         * @param {object} event : click event object
         */
        function drawAnnotation(item, event){

            // remove current drawing annotation
            if(vm.editingAnatomy && vm.editingAnatomy != item){
                vm.editingAnatomy.isDrawing = false;
                AnnotationsService.drawAnnotation({
                    svgID : vm.editingAnatomy.svgID,
                    groupID : vm.editingAnatomy.groupID,
                    mode : (vm.editingAnatomy.isDrawing) ? "ON" : "OFF"
                });
            };

            // change current drawing annotation to selected one
            vm.editingAnatomy = item;
            vm.editingAnatomy.isDrawing = !vm.editingAnatomy.isDrawing;
            vm.displayDrawingRequiredError = false;

            AnnotationsService.drawAnnotation({
                svgID : vm.editingAnatomy.svgID,
                groupID : vm.editingAnatomy.groupID,
                mode : (vm.editingAnatomy.isDrawing) ? "ON" : "OFF"
            });

            event.stopPropagation();
        }

        /**
         * click the setting icon to open the setting panel for the specific annotation
         * @param {object} item : the anatomy's annotations object
         */
        function editAnatomyAnnotations(item, index, event){
            if(event){
                event.stopPropagation();
            }

            vm.editingAnatomy = item || null;
            vm.editingAnatomyIndex = index || -1;
            vm.showPanel = (item !== null) ? true : false;

            if (item !== null) {
                // TODO is this unnecessary?
                annotationEditForm.rows = [{}];
                annotationEditForm.submissionRows = [{}];
                annotationEditForm.foreignKeyData = [{}];
                annotationEditForm.oldRows = [{}];

                // TODO if the data is not in database, the form is create right? default values etc.
                if (!item.tuple) {
                    var values = {};
                    values[annotConstant.ANNOTATED_TERM_COLUMN_NAME] = item.id;
                    recordCreate.populateCreateModelValues(annotationEditForm, annotationEditForm.reference, null, values);
                } else {
                    recordCreate.populateEditModelValues(annotationEditForm, annotationEditForm.reference, item.tuple, 0, false);
                }
            }
            AlertsService.deleteAllAlerts();
        }

        /**
         * filter annotations based on keyword
         * if svgID or groupID not exist -> not qualified
         * @param {object} item : the anatomy's annotations object
         */
        function filterAnnotations(item){

            if(!item.svgID || !item.groupID){
                return false;
            }
            var id = item && item.id ? item.id.toLowerCase() : "",
                name = item && item.name ? item.name.toLowerCase() : "",
                keyword = vm.searchKeyword ? vm.searchKeyword.toLowerCase() : "";

            return (id.indexOf(keyword) >= 0) || (name.indexOf(keyword) >= 0);
        }

        /**
         * Click to highlight the anatomy's annotations
         * @param {obejct} item : the anatomy's annotations object
         * @param {object} event : click event object
         */
        function highlightGroup(item, event){
            vm.changeSelectingAnnotation(item);
            // Unhide the annotation if it's hidden
            if(!item.isDisplay){
                vm.toggleDisplay(item);
            }
            // Notify openseadragon to highlight the annotations
            AnnotationsService.highlightAnnotation({
                svgID : item.svgID,
                groupID : item.groupID
            });

            event.stopPropagation();
        }

        /**
         * remove annotation record from the table
         * show delete modal to let user confirm whether to delete it
         * @param {object} item : the anatomy's annotations object
         */
        function removeAnnotationEntry(item){
            var i = 0,
                row = null,
                isFound = false;

            modalUtils.showModal({
                animation: false,
                templateUrl:  UriUtils.chaiseDeploymentPath() + "common/templates/delete-link/confirm_delete.modal.html",
                controller: "ConfirmDeleteController",
                controllerAs: "ctrl",
                size: "sm"
            }, function onSuccess(res) {
                vm.annotationFormPendingResult = true;
                AnnotationsService.removeEntry(item).then(function(){
                    vm.annotationFormPendingResult = false;
 
                    // OPTIMIZE: do we need to go over the list?
                    for(i = 0; i < vm.annotationModels.length; i++){
                        row = vm.annotationModels[i];
                        if(row.id === item.id){
                            isFound = true;
                            break;
                        }
                    }

                    if(isFound){
                        // remove from the list
                        vm.annotationModels.splice(i, 1);

                        // update the total number of annotations
                        vm.updateDisplayNum();

                        // remove svg object from openseadragon
                        if(item.svgID){
                            AnnotationsService.removeSVG({svgID : item.svgID});
                        }

                        // close the current panel
                        vm.closeAnnotationForm();
                    }
                }).catch(function (err) {
                    console.log("error while deleteing:", err);
                });
            }, null, false);
        }

        // Search based on the keyword
        function search(){
            vm.updateDisplayNum();
        }

        /**
         * Save the SVG content and updated metadata of editing anatomy item
         * @param {object} data : content contains group ID, svg content and number of annotations
         */
        function saveAnatomySVGFile(data){
            // if there are no overlay drawn
            var noAnnot;
            if (data.content.length <= 0 || data.content[0].svg === "" || data.content[0].numOfAnnotations === 0) {
                noAnnot = true;
                vm.displayDrawingRequiredError = true;
            }
            
            if(noAnnot || vm.annoForm.$invalid){
                _displaySubmitError();
                return;
            }
            vm.annotationFormPendingResult = true;

            var formModel = vm.editingAnatomy.isNew ? annotationCreateForm : annotationEditForm,
                isUpdate = !vm.editingAnatomy.isNew && vm.editingAnatomy.isStoredInDB,
                originalTuple = null,
                imageRID = context.imageID,
                fileName,
                file;

            if (isUpdate) {
                originalTuple = vm.editingAnatomy.tuple;
            }

            recordCreate.populateSubmissionRow(
                formModel.rows[0],
                formModel.submissionRows[0],
                formModel.reference,
                originalTuple,
                isUpdate
            );

            // <Image_RID>_<Anatomy_ID>_z<Z_Index>.svg
            fileName = imageRID + "_" + formModel.submissionRows[0][annotConstant.ANNOTATED_TERM_COLUMN_NAME];
            if (context.defaultZIndex != null) {
                fileName += "_z" + context.defaultZIndex;
            }
            file = new File([data.content[0].svg], fileName + ".svg", {
                type : "image/svg+xml"
            });

            // add the image value
            formModel.submissionRows[0][annotConstant.REFERENCE_IMAGE_COLUMN_NAME] = imageRID;
            
            // add the default z index value
            if (context.defaultZIndex != null) {
                formModel.submissionRows[0][annotConstant.Z_INDEX_COLUMN_NAME] = context.defaultZIndex;
            }

            // change the overlay file value
            formModel.submissionRows[0][annotConstant.OVERLAY_COLUMN_NAME] = {
                uri : fileName,
                file : file,
                fileName : fileName,
                fileSize : file.size,
                hatracObj : new ERMrest.Upload(file, {
                    column: formModel.reference.columns.find(function (column) {return column.name == annotConstant.OVERLAY_COLUMN_NAME}),
                    reference: formModel.reference
                })
            };

            // TODO why pass vm??
            // TODO the last element is logObject, should be changed later...
            recordCreate.addRecords(isUpdate, null, formModel, false, formModel.reference, [originalTuple], {}, vm, function (formModel, result) {
                var afterMutation = function (tuple) {
                    vm.annotationFormPendingResult = false;
                    var savedItem = vm.editingAnatomy;

                    // update SVG ID (NEW_SVG) after successfully created
                    var newSvgID = (!isUpdate && savedItem.svgID === "NEW_SVG") ? Date.parse(new Date()) + parseInt(Math.random() * 10000) : savedItem.svgID;
                    if(savedItem.svgID !== newSvgID){
                        AnnotationsService.changeSVGId({
                            svgID : savedItem.svgID,
                            newSvgID : newSvgID,
                        });
                        savedItem.svgID = newSvgID;
                    }

                    // update the tuple
                    savedItem.tuple = tuple;
                    savedItem.isStoredInDB = true;
                    savedItem.isNew = false;

                    // update the annotationModels
                    var rowIndex = vm.editingAnatomyIndex;
                    if (rowIndex !== -1) { // it's part of the form
                        vm.annotationModels[rowIndex] = savedItem;
                    } else { // should be added to the form
                        vm.annotationModels.push(savedItem);
                    }

                    vm.updateDisplayNum();
                    vm.closeAnnotationForm();

                    AlertsService.addAlert("Your data has been saved.", "success");
                };

                var resultTuple = (result.successful.length > 0) ? result.successful.tuples[0] : null;

                // NOTE this cannot happen since we're asking for row change,
                // so if it fails, the promise will be rejected and not resolved.
                // But I added this for consistency.
                if (!resultTuple) {
                    AlertsService.addAlert("Something went wrong. Please try again.", "error");
                    return;
                }

                // TODO properly pass log object
                // read the currently saved data, so we can capture the tuple in correct context
                resultTuple.reference.contextualize.entryEdit.read(1).then(function (page) {
                    if (page.length != 1) {
                        console.log("the currently added row was not visible.");
                    }
                    afterMutation(page.length == 1 ? page.tuples[0] : resultTuple);
                }).catch(function (err) {
                    console.log("error while reading after create/update:", err);
                    afterMutation(resultTuple)
                });

            }, {});
        }

        /**
         * Notfiy openseadragon to export the editing anatomy's annotations before saving
         * @param {object} item : the editing anatomy's annotations object
         */
        function saveAnnotationRecord(item){
            AlertsService.deleteAllAlerts();
            // if (vm.annoForm.$invalid) {
            //     _displaySubmitError();
            //     return;
            // }

            AnnotationsService.saveAnnotationRecord({
                svgID : item.svgID,
                groupID : item.groupID
            });
        }

        function _displaySubmitError() {
            angular.element(document.getElementsByClassName('annotation-list-container')[0]).scrollTo(0, 0, 500);
            AlertsService.addAlert('Sorry, the data could not be submitted because there are errors on the form. Please check all fields and try again.', 'error');
            vm.annoForm.$setSubmitted();
        }

        // Toggle the display of the anatomy's annotations
        function toggleDisplay(item, event){
            item.isDisplay = !item.isDisplay;

            // notify openseadragon to update the display
            AnnotationsService.changeAnnotationVisibility({
                svgID : item.svgID,
                groupID : item.groupID,
                isDisplay : item.isDisplay
            });

            if(event){
                event.stopPropagation();
            }
        }

        /**
         * Update the total number of annotations and displayed filtered annotations
         */
        function updateDisplayNum(){
            var totalCount = 0; // total numver of qualified anatomy annotations
            var matchCount = 0; // total matched number of filtered anatomy annotations
            var item = null;

            for(var i = 0; i < vm.annotationModels.length; i++){
                item = vm.annotationModels[i];
                totalCount = item.svgID && item.groupID ? totalCount + 1 : totalCount;
                if(vm.filterAnnotations(item)){
                    matchCount += 1;
                    item.isShow = true;
                }
                else{
                    item.isShow = false;
                }
            }

            vm.totalCount = totalCount;
            vm.matchCount = matchCount;
        }
    }]);
})();
