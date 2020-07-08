(function() {
    // 'use strict';

    angular.module('chaise.viewer')

    .controller('AnnotationsController', ['AlertsService', 'annotationCreateForm', 'annotationEditForm', 'annotations','AnnotationsService', 'AuthService', 'comments', 'context', 'CommentsService', 'ConfigUtils', 'DataUtils', 'InputUtils', 'UriUtils', 'modalUtils', 'modalBox', 'recordsetDisplayModes', 'recordCreate', 'logService', 'viewerModel', '$q', '$rootScope','$scope', '$timeout', '$uibModal', '$window', 'viewerConstant',
    function AnnotationsController(AlertsService, annotationCreateForm, annotationEditForm, annotations,AnnotationsService, AuthService, comments, context, CommentsService, ConfigUtils, DataUtils, InputUtils, UriUtils, modalUtils , modalBox,recordsetDisplayModes, recordCreate, logService, viewerModel, $q, $rootScope, $scope, $timeout, $uibModal, $window, viewerConstant) {

        console.log("annotation controller created!");
        var chaiseConfig = Object.assign({}, ConfigUtils.getConfigJSON());
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
        vm.viewerModel = viewerModel; // model that contains antaomy's annotations
        vm.showPanel = false; // whether to show annotation metadata panel
        vm.isDisplayAll = true; // whether to show all annotations
        vm.searchKeyword = ""; // search keyword
        vm.totalCount = 0; // total number of annotation list
        vm.matchCount = 0; // number of filtered annotations
        vm.selectedItem = null; // current selected annotation item
        vm.strokeScale = 1; // stroke size of the annotation
        vm.editingAnatomy = null; // current setting anatomy from viewerModel
        vm.editingAnatomyIndex = null;

        vm.addNewTerm = addNewTerm;
        vm.changeAllAnnotationsVisibility = changeAllAnnotationsVisibility;
        vm.changeStrokeScale = changeStrokeScale;
        vm.changeSelectingAnnotation = changeSelectingAnnotation;
        vm.changeTerm = changeTerm;
        vm.clearSearch = clearSearch;
        vm.closeAnnotationForm = closeAnnotationForm;
        vm.drawAnnotation = drawAnnotation;
        vm.editAnatomyAnnotations = editAnatomyAnnotations;
        vm.highlightGroup = highlightGroup;
        vm.removeAnnotationEntry = removeAnnotationEntry;
        vm.search = search;
        vm.searchPopup = searchPopup;
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

                            item = vm.viewerModel.rows.find(function(item){
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
                    default:
                        console.log('Invalid event message type "' + messageType + '"');
                }
            } else {
                console.log('Invalid event origin. Event origin: ', event.origin, '. Expected origin: ', window.location.origin);
            }
        });

        // TODO should be removed
        function populateSubmissionRow(modelRow, submissionRow, originalTuple, columns, editOrCopy) {
            var transformedRow = transformRowValues(modelRow);
            columns.forEach(function (column) {
                // If the column is a foreign key column, it needs to get the originating columns name for data submission
                if (column.isForeignKey) {

                    var foreignKeyColumns = column.foreignKey.colset.columns;
                    for (var k = 0; k < foreignKeyColumns.length; k++) {
                        var referenceColumn = foreignKeyColumns[k];
                        var foreignTableColumn = column.foreignKey.mapping.get(referenceColumn);
                        // check if value is set in submission data yet
                        if (!submissionRow[referenceColumn.name]) {
                            /**
                             * User didn't change the foreign key, copy the value over to the submission data with the proper column name
                             * In the case of edit, the originating value is set on $rootScope.tuples.data. Use that value if the user didn't touch it (value could be null, which is fine, just means it was unset)
                             * In the case of create, the value is unset if it is not present in submissionRows and because it's newly created it doesn't have a value to fallback to, so use null
                            **/
                            if (editOrCopy && undefined != originalTuple.data[referenceColumn.name]) {
                                submissionRow[referenceColumn.name] = originalTuple.data[referenceColumn.name];
                            } else {
                                submissionRow[referenceColumn.name] = null;
                            }
                        }
                    }
                // not foreign key, column.name is sufficient for the keys
                } else {
                    // set null if not set so that the whole data object is filled out for posting to ermrestJS
                    submissionRow[column.name] = (transformedRow[column.name] === undefined) ? null : transformedRow[column.name];
                }
            });

            return submissionRow;
        }

        // TODO should be removed
        /*
         * Allows to tranform some form values depending on their types
         * Boolean: If the value is empty ('') then set it as null
         * Date/Timestamptz: If the value is empty ('') then set it as null
         */
        function transformRowValues(row) {
            var transformedRow = {};
            /* Go through the set of columns for the reference.
             * If a value for that column is present (row[col.name]), transform the row value as needed
             * NOTE:
             * Opted to loop through the columns once and use the row object for quick checking instead
             * of looking at each key in row and looping through the column set each time to grab the column
             * My solution is worst case n-time
             * The latter is worst case rowKeys.length * n time
             */
            for (var i = 0; i < $rootScope.annotationReference.columns.length; i++) {
                var col = $rootScope.annotationReference.columns[i];
                var rowVal = row[col.name];
                if (rowVal && !col.getInputDisabled(context.appContext)) {
                    if (col.type.isArray) {
                        rowVal = JSON.parse(rowVal);
                    } else {
                        switch (col.type.name) {
                            case "timestamp":
                            case "timestamptz":
                                if (vm.readyToSubmit) {
                                    var options = {
                                        outputType: "string",
                                        currentMomentFormat: dataFormats.date + dataFormats.time12 + 'A',
                                        outputMomentFormat: dataFormats.datetime.submission
                                    }

                                    // in create if the user doesn't change the timestamp field, it will be an object in form {time: null, date: null, meridiem: AM}
                                    // meridiem should never be null, time can be left empty (null) the case below will catch that.
                                    if (rowVal.time === null) rowVal.time = '00:00:00';
                                    var value = rowVal.date ? rowVal.date + rowVal.time + rowVal.meridiem : null;

                                    rowVal = InputUtils.formatDatetime(value, options);
                                }
                                break;
                            case "json":
                            case "jsonb":
                                rowVal=JSON.parse(rowVal);
                                break;
                            default:
                                if (col.isAsset) {
                                    if (!vm.readyToSubmit) {
                                        rowVal = { url: "" };
                                    }
                                }
                                break;
                        }
                    }
                }
                transformedRow[col.name] = rowVal;
            }
            return transformedRow;
        }

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

        function fixedEncodeURIComponent(id) {
          var result = encodeURIComponent(id).replace(/[!'()*]/g, function(c) {
              return '%' + c.charCodeAt(0).toString(16).toUpperCase();
          });
          return result;
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

                if(svgID === "NEW_SVG" || groupID === "NEW_GROUP"){
                    continue;
                }

                if(vm.viewerModel.rows.find(function (item) { return item.groupID === groupID})){
                    continue;
                }
                /* HACK: This is done for the demo, the all ids are not available currently.
                Also the encodeURI is the same as ERMrest's _fixedEncodeURIComponent_. Since it
                is still not clear what will be th format of id.*/

                var metadata = groupID.split(',');
                var name, ermrestID, id;
                if (metadata.length == 1) {
                  if (metadata[0].indexOf(':') !== -1) {
                    encodedId = fixedEncodeURIComponent(dict[metadata[0]]);
                    id = metadata[0];
                  } else {
                    name = metadata[0];
                  }
                } else {
                  for (var j = 0; j < metadata.length ; j++ ){
                    if (metadata[j].indexOf(':') !== -1) {
                      encodedId = (dict.hasOwnProperty(metadata[0])) ? fixedEncodeURIComponent(dict[metadata[0]]) : fixedEncodeURIComponent(metadata[0]);
                      id = metadata[j];
                    } else {
                      name = metadata[j];
                    }
                  }
                }

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
                    isShow : true,
                    name: name,
                    id: id,
                    url: "/chaise/record/#2/Vocabulary:Anatomy/ID="+encodedId,
                    Image : context.imageID,
                    Anatomy : id,
                    Curation_Status : "In Preparation"
                };

                row = vm.viewerModel.rows.find(function (row, index) {
                    if(row.Anatomy === id){
                        i = index;
                        return true;
                    }
                    return false;
                });

                // if row with same anatomy id exists in the viewer model -> update it
                if(row){
                    Object.assign(vm.viewerModel.rows[i], obj);
                }
                // add new row to the viewer model
                else{
                    vm.viewerModel.rows.push(obj);
                }

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
                name: null,
                id: null,
                url: null
            };

            recordCreate.populateCreateDefaultValues(annotationCreateForm, annotationCreateForm.reference);

            // this attribute is needed by inputs.js
            $rootScope.reference = null

            // Set it to show the setting panel
            vm.editAnatomyAnnotations(newAnnotation);

            // Notify OSD to create a new svg and group for annotations
            AnnotationsService.addNewTerm({
                svgID : "NEW_SVG",
                groupID : "NEW_GROUP",
                anatomy : "",
                description : ""
            });

        }

        // Click to toggle overlay visibility in Openseadragon
        function changeAllAnnotationsVisibility(){
            vm.isDisplayAll = !vm.isDisplayAll;
            vm.viewerModel.rows.forEach(function(item){
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
         * change the Anatomy ID in current annotation object
         * @param {object} item : each annotation object in the viewerModel.row
         * @param {object} event
         */
        function changeTerm(item, event){
            vm.searchPopup($rootScope.annotationReference.columns[1], function(tuple){
                var data = tuple._data;
                var id = fixedEncodeURIComponent(data.ID);

                if(checkAnatomyIDExist(data.ID)){
                    AlertsService.addAlert("This Anatomy ID already exists, please select other terms.", "warning");
                    return;
                }

                // Update the new Anatomy name and ID at openseadragon viewer
                AnnotationsService.changeGroupInfo({
                    svgID : item.svgID,
                    groupID : item.groupID,
                    newGroupID : data.ID + "," + data.Name,
                    newAnatomy : data.Name + " (" + data.ID + ")"
                });

                item["groupID"] = data.ID + "," + data.Name;
                item["name"] = data.Name;
                item["id"] = data.ID;
                item["url"] = "/chaise/record/#2/Vocabulary:Anatomy/ID=" + id;
                item["Anatomy"] = data.ID;
            })
        }

        // Check whether anatomy id has existed in the viewerModel
        function checkAnatomyIDExist(id){
            return vm.viewerModel.rows.find(function (row) { return row.id === id}) ? true : false;
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
            vm.editingAnatomy.isRequiredError = false;

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
            vm.showPanel = (item !== null) ? true : false;
            vm.editingAnatomy = item || null;
            vm.editingAnatomyIndex = index || -1;

            if(event){
                event.stopPropagation();
            }
        }

        /**
         * filter anatomy's annotations based on keyword
         * if svgID or groupID not exist -> not qualified
         * @param {object} item : the anatomy's annotations object
         */
        function filterAnnotations(item){

            if(!item.svgID || !item.groupID){
                return false;
            }
            var anatomy = item && item.Anatomy ? item.Anatomy.toLowerCase() : "",
                name = item && item.name ? item.name.toLowerCase() : "",
                keyword = vm.searchKeyword ? vm.searchKeyword.toLowerCase() : "";

            return (anatomy.indexOf(keyword) >= 0) || (name.indexOf(keyword) >= 0);
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
                delItem = null;
                isFound = false;

            modalUtils.showModal({
                animation: false,
                templateUrl:  UriUtils.chaiseDeploymentPath() + "common/templates/delete-link/confirm_delete.modal.html",
                controller: "ConfirmDeleteController",
                controllerAs: "ctrl",
                size: "sm"
            }, function onSuccess(res) {
                removeAnatomy(item);
            }, null, false);
        }

        /**
         * remove annotation record from the table
         * @param {object} item : the anatomy's annotations object
         */
        function removeAnatomy(item){
            return AnnotationsService.removeEntry(item)
                .then(function(result){

                    delItem = result.item;

                    for(i = 0; i < vm.viewerModel.rows.length; i++){
                        row = vm.viewerModel.rows[i];
                        if(row.Image === delItem.Image && row.Anatomy === delItem.Anatomy){
                            isFound = true;
                            break;
                        }
                    }

                    if(isFound){
                        // remove row from rows
                        vm.viewerModel.rows.splice(i, 1);

                        // update the total number of annotations
                        vm.updateDisplayNum();

                        // remove svg object from openseadragon
                        if(delItem.svgID){
                            AnnotationsService.removeSVG({svgID : delItem.svgID});
                        }

                        // close the current panel
                        vm.closeAnnotationForm();
                    }
                });
        }

        // Search based on the keyword
        function search(){
            vm.updateDisplayNum();
        }

        /**
         *
         * @param {object} column
         * @param {function} callback : callback after user select the
         */
        function searchPopup(column, callback){

            var params = {};
            var submissionRow = {
                Specimen: null,
                Region: null,
                Strength: null,
                Strength_Modifier: null,
                Pattern: null,
                Pattern_Location: null,
                Density: null,
                Density_Direction: null,
                Density_Magnitude: null,
                Density_Relative_To: null,
                Density_Note: null,
                Notes: null,
                RCT: null,
                RMT: null
            };
            params.parentReference = $rootScope.annotationReference;
            params.parentTuple = null;
            params.displayname = column.displayname;
            params.displayMode = vm.editingAnatomy.isNew ? recordsetDisplayModes.foreignKeyPopupCreate: recordsetDisplayModes.foreignKeyPopupEdit;
            params.reference = column.filteredRef(submissionRow, {}).contextualize.compactSelect;;
            params.reference.session = $rootScope.session;
            params.selectedRows = [];
            params.selectMode = "single-select";
            params.showFaceting = true;
            params.facetPanelOpen = false;
            // Note : it needs proper log parameters
            params.logStack = $rootScope.logStack;
            params.logStackPath = $rootScope.logStackPath;

            modalUtils.showModal({
                animation: false,
                controller: "SearchPopupController",
                windowClass: "search-popup foreignkey-popup",
                controllerAs: "ctrl",
                resolve: {
                    params: params
                },
                size: modalUtils.getSearchPopupSize(params),
                templateUrl: UriUtils.chaiseDeploymentPath() + "common/templates/searchPopup.modal.html"
            }, callback, null, false);
        }

        /**
         * Save the SVG content and updated metadata of editing anatomy item
         * @param {object} data : content contains group ID, svg content and number of annotations
         */
        function saveAnatomySVGFile(data){
            var originalTuple,
                isUpdate = false,
                model = vm.viewerModel,
                imageID = context.imageID,
                anatomyID = data.content[0].groupID,
                fileName,
                file,
                submissionRow = {},
                tuples = [],
                row,
                reference;

            if(data.content[0].numOfAnnotations === 0){
                vm.editingAnatomy.isRequiredError = true;
                _displaySubmitError();
                return;
            }

            if(data.content.length <= 0 || data.content[0].svg === ""){
                return;
            }

            anatomyID = anatomyID.split(",")[0];
            fileName = anatomyID ? anatomyID.replace(":", "%3A") : "UnknownAnatomy";
            file = new File([data.content[0].svg], fileName + ".svg", {
                type : "image/svg+xml"
            });
            console.log("saving file: ", file);

            // check whether Image and Anatomy entry exist in the table
            AnnotationsService.checkEntryExist(imageID, anatomyID).then(function(page){
                console.log("record exist : ", (page.length > 0 ) ? true : false);
                // update the existing entry
                if(page.length > 0){
                    isUpdate = true;
                    reference = annotationEditForm.reference
                    row = model.rows.find(function (r) {return r.Anatomy === anatomyID && r.Image === imageID});
                    if(row){
                        submissionRow["Image"] = row.Image;
                        submissionRow["Anatomy"] = row.Anatomy;
                        submissionRow["Curation_Status"] = row.Curation_Status;
                        submissionRow[viewerConstant.annotation.ASSET_COLUMN_NAME] = {
                            uri : fileName,
                            file : file,
                            fileName : fileName,
                            fileSize : file.size,
                            hatracObj : new ERMrest.Upload(file, {
                                column: reference.columns.find(function (column) {return column.name == viewerConstant.annotation.ASSET_COLUMN_NAME}),
                                reference: reference
                            })
                        };
                        tuples.push(page.tuples[0].copy());
                        vm.viewerModel.submissionRows = [submissionRow];
                    }

                }
                // create a new record
                else{
                    isUpdate = false;
                    reference = annotationCreateForm.reference;
                    submissionRow = populateSubmissionRow({}, submissionRow, originalTuple, reference.columns, false);
                    submissionRow["Image"] = imageID;
                    submissionRow["Anatomy"] = anatomyID;
                    submissionRow[viewerConstant.annotation.ASSET_COLUMN_NAME] = {
                        uri : fileName,
                        file : file,
                        fileName : fileName,
                        fileSize : file.size,
                        hatracObj : new ERMrest.Upload(file, {
                            column: reference.columns.find(function (column) {return column.name == viewerConstant.annotation.ASSET_COLUMN_NAME}),
                            reference: reference
                        })
                    };
                    vm.viewerModel.submissionRows = [submissionRow];
                    console.log(submissionRow);
                }

                recordCreate.addRecords(isUpdate, null, vm.viewerModel, false, reference, tuples, context.queryParams, vm, function (model, result) {
                    console.log("save svg file sucess! successful callback ", model, result);
                    AlertsService.addAlert("Your data has been saved.", "success");

                    var savedData = (result.successful.length > 0) ? result.successful.tuples[0].copy().data : {};
                    var savedItem = vm.editingAnatomy;
                    var newSvgID = (!isUpdate && savedItem.svgID === "NEW_SVG") ? Date.parse(new Date()) + parseInt(Math.random() * 10000) : savedItem.svgID;
                    var rowIndex = vm.editingAnatomyIndex;
                    // update SVG ID (NEW_SVG) after successfully created
                    if(savedItem.svgID !== newSvgID){
                        AnnotationsService.changeSVGId({
                            svgID : savedItem.svgID,
                            newSvgID : newSvgID,
                        });
                        savedItem.svgID = newSvgID;
                        savedItem.isNew = false;
                    }

                    // if rowIndex exist
                    if(rowIndex !== -1){
                        // update the old row with same anatomy id
                        if(model.rows[rowIndex].Anatomy === vm.editingAnatomy.Anatomy){
                            Object.assign(vm.viewerModel.rows[rowIndex], savedItem, savedData);
                        }
                        else{
                            // remove the old one with different anatomy id
                            removeAnatomy({
                                Anatomy : model.rows[rowIndex].Anatomy,
                                Image : model.rows[rowIndex].Image
                            });

                            // add the saved annotation to viewerModel
                            Object.assign(vm.editingAnatomy, savedItem, savedData);
                            vm.viewerModel.rows.push(vm.editingAnatomy);
                        }
                    }
                    else{
                        // add the saved annotation to viewerModel
                        Object.assign(vm.editingAnatomy, savedItem, savedData);
                        vm.viewerModel.rows.push(vm.editingAnatomy);
                    }
                    vm.updateDisplayNum();
                    vm.closeAnnotationForm();

                }, context.logObject);
            });
        }

        /**
         * Notfiy openseadragon to export the editing anatomy's annotations before saving
         * @param {object} item : the editing anatomy's annotations object
         */
        function saveAnnotationRecord(item){
            if (vm.annoForm.$invalid) {
                _displaySubmitError();
                return;
            }

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

            for(var i = 0; i < vm.viewerModel.rows.length; i++){
                item = vm.viewerModel.rows[i];
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
