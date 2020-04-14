(function() {
    // 'use strict';

    angular.module('chaise.viewer')

    .controller('AnnotationsController', ['AlertsService', 'anatomies', 'annotations','AnnotationsService', 'AuthService', 'comments', 'context', 'CommentsService', 'ConfigUtils', 'DataUtils', 'InputUtils', 'UriUtils', 'modalUtils', 'modalBox', 'recordsetDisplayModes', 'recordCreate', 'logService', 'viewerModel', '$q', '$rootScope','$scope', '$timeout', '$uibModal', '$window',
    function AnnotationsController(AlertsService, anatomies, annotations,AnnotationsService, AuthService, comments, context, CommentsService, ConfigUtils, DataUtils, InputUtils, UriUtils, modalUtils , modalBox,recordsetDisplayModes, recordCreate, logService, viewerModel, $q, $rootScope, $scope, $timeout, $uibModal, $window) {
        
        console.log("annotation controller created!");
        var chaiseConfig = Object.assign({}, ConfigUtils.getConfigJSON());
        var vm = this;

        vm.viewerModel = viewerModel;
        vm.editMode = (context.mode == context.modes.EDIT ? true : false);
        vm.isDisplayAll = true; // whether to show all annotations
        vm.collection = []; // annotation list
        vm.searchKeyword = "";
        vm.totalCount = 0; // total number of annotation list
        vm.selectedItem = null; // current selected annotation item
        vm.strokeScale = 1;

        vm.annotations = annotations;
        vm.anatomies = anatomies;
        vm.curEditAnnotation = null;
        vm.settingAnnotation = null;
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
        vm.manageSetting = manageSetting;
        vm.changeSelectingAnnotation = changeSelectingAnnotation;
        vm.changeStrokeScale = changeStrokeScale;
        vm.searchPopup = searchPopup;
        vm.drawAnnotation = drawAnnotation;
        vm.changeTerm = changeTerm;
        vm.changeStatus = changeStatus;
        vm.addNewTerm = addNewTerm;
        vm.saveAnatomySVGFile = saveAnatomySVGFile;
        vm.updateRecord = updateRecord;
        vm.saveAnnotationRecord = saveAnnotationRecord;
        vm.removeAnnotationEntry = removeAnnotationEntry;

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
                            vm.addAnnotation(data.content);
                            vm.totalCount = vm.viewerModel.rows.length;
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

        function saveAnatomySVGFile(data){
            var originalTuple,
                editOrCopy = true,
                model = vm.viewerModel,
                imageID = context.imageID,
                anatomyID = data.content[0].groupID,
                fileName,
                file,
                submissionRow = {},
                tuples = [],
                row,
                assetCol = $scope.reference.columns.find(column => column.name == "File_URI");

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
                    row = model.rows.find(r => r.Anatomy === anatomyID && r.Image === imageID);
                    if(row){
                        submissionRow["Image"] = row.Image;
                        submissionRow["Anatomy"] = row.Anatomy;
                        submissionRow["Record_Status"] = row.Record_Status;
                        submissionRow["Curation_Status"] = row.Curation_Status;
                        submissionRow["File_URI"] = {
                            uri : fileName,
                            file : file,
                            fileName : fileName,
                            fileSize : file.size,
                            hatracObj : new ERMrest.Upload(file, {
                                column: assetCol,
                                reference: $rootScope.reference
                            })
                        };
                        tuples.push(page.tuples[0].copy());
                        vm.viewerModel.submissionRows = [submissionRow];
                        recordCreate.addRecords(true, null, vm.viewerModel, false, $rootScope.reference, tuples, context.queryParams, vm, onSuccess, context.logObject);
                    };
                    
                }
                // create a new record
                else{
                    submissionRow = populateSubmissionRow({}, submissionRow, originalTuple, $rootScope.reference.columns, false);
                    submissionRow["Image"] = imageID;
                    submissionRow["Anatomy"] = anatomyID;
                    submissionRow["File_URI"] = {
                        uri : fileName,
                        file : file,
                        fileName : fileName,
                        fileSize : file.size,
                        hatracObj : new ERMrest.Upload(file, {
                            column: assetCol,
                            reference: $rootScope.reference
                        })
                    };
                    vm.viewerModel.submissionRows = [submissionRow];
                    console.log(submissionRow);
                    recordCreate.addRecords(false, null, vm.viewerModel, false, $rootScope.reference, [], context.queryParams, vm, onSuccess, context.logObject);
                }
            });
        }

        function removeAnnotationEntry(item){
            AnnotationsService.removeEntry(item.Image,item.Anatomy);
        }

        function saveAnnotationRecord(item){

            AnnotationsService.saveAnnotationRecord({
                svgID : item.svgID,
                groupID : item.groupID
            });
        }
        /**
         * onSuccess - callback after results are added
         *
         * @param  {object} model  model contains updated record object
         * @param  {object} result object has result messages
         */
        function onSuccess(model, result){
            console.log("save svg file sucess! successful callback ", model, result);
            AlertsService.addAlert("Your data has been saved.", "success");
            AnnotationsService.notifySaveResult({result : "success"});

            if(vm.curEditAnnotation){
                vm.curEditAnnotation.isDrawing = false;
                vm.curEditAnnotation = null;
            };
        }

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
            for (var i = 0; i < $rootScope.reference.columns.length; i++) {
                var col = $rootScope.reference.columns[i];
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
            params.parentReference = $rootScope.reference;
            params.parentTuple = null;
            params.displayname = $rootScope.reference.displayname;
            params.displayMode = vm.editMode ? recordsetDisplayModes.foreignKeyPopupEdit : recordsetDisplayModes.foreignKeyPopupCreate;
            params.reference = column.filteredRef(submissionRow, {}).contextualize.compactSelect;;
            params.reference.session = $rootScope.session;
            params.context = "compact/select";
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

        // function drawAnnotation(type) {
        //     vm.newAnnotation.type = type;
        //     return AnnotationsService.drawAnnotation();
        // }

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

        function fixedEncodeURIComponent(id) {
          var result = encodeURIComponent(id).replace(/[!'()*]/g, function(c) {
              return '%' + c.charCodeAt(0).toString(16).toUpperCase();
          });
          return result;
        }

        // Add new annotation items
        function addAnnotation(items){
            var groupID,
                i,
                svgID,
                row,
                obj,
                isExist;

            // HACK: For mapping the id of human anatomy
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
                isExist = false;
                if(vm.viewerModel.rows.find(item => item.groupID === groupID)){
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
                obj = {
                    groupID : groupID,
                    svgID : svgID,
                    anatomy : items[i].anatomy,
                    description : items[i].description,
                    isSelected : false,
                    isDrawing : false,
                    isDisplay: true,
                    name: name,
                    id: id,
                    url: "/chaise/record/#2/Vocabulary:Anatomy/ID="+encodedId,
                };

                row = vm.viewerModel.rows.find((row, index) => {
                    if(row.Anatomy === id){
                        i = index;
                        return true;
                    }
                });
                if(row){
                    vm.viewerModel.rows[i] = { ...vm.viewerModel.rows[i], ...obj};
                    // for(i = 0; i < vm.viewerModel.rows.length; i++){
                    //     if(vm.viewerModel.rows[i].Anatomy === id){
                    //         vm.viewerModel.rows[i] = { ...vm.viewerModel.rows[i], ...obj};
                    //     }
                    // }
                }
                else{
                    vm.viewerModel.rows.push(obj);
                }
                
                
                // vm.collection.push({
                //     groupID : groupID,
                //     svgID : svgID,
                //     anatomy : items[i].anatomy,
                //     description : items[i].description,
                //     isSelected : false,
                //     isDrawing : false,
                //     isDisplay: true,
                //     name: name,
                //     id: id,
                //     url: "/chaise/record/#2/Vocabulary:Anatomy/ID="+encodedId,
                // });
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

        function drawAnnotation(item, event){

            // remove current drawing annotation
            if(vm.curEditAnnotation && vm.curEditAnnotation != item){
                vm.curEditAnnotation.isDrawing = false;
                AnnotationsService.drawAnnotation({
                    svgID : vm.curEditAnnotation.svgID,
                    groupID : vm.curEditAnnotation.groupID,
                    mode : (vm.curEditAnnotation.isDrawing) ? "ON" : "OFF"
                });
            };

            // change current drawing annotation to selected one
            vm.curEditAnnotation = item;
            vm.curEditAnnotation.isDrawing = !vm.curEditAnnotation.isDrawing;
    
            AnnotationsService.drawAnnotation({
                svgID : vm.curEditAnnotation.svgID,
                groupID : vm.curEditAnnotation.groupID,
                mode : (vm.curEditAnnotation.isDrawing) ? "ON" : "OFF"
            });

            event.stopPropagation();
        }

        function changeStrokeScale(){
            // console.log(vm.strokeScale);
            AnnotationsService.changeStrokeScale(vm.strokeScale);
        }

        function checkAnatomyIDExist(id){
            return vm.viewerModel.rows.find(row => row.id === id) ? true : false;
        }
        /**
         * change the Anatomy ID in current annotation object
         * @param {object} item : each annotation object in the viewerModel.row 
         * @param {*} event 
         */
        function changeTerm(item, event){
            vm.searchPopup($rootScope.reference.columns[1], function(tuple){
                var data = tuple._data;
                var id = fixedEncodeURIComponent(data.ID);
                
                if(checkAnatomyIDExist(data.ID)){
                    AlertsService.addAlert("This Anatomy ID already exists, please select other terms.", "warning");
                    return;
                }
                
                AnnotationsService.changeGroupInfo({
                    svgID : item.svgID,
                    groupID : item.groupID,
                    newGroupID : data.ID + "," + data.Name,
                    newAnatomy : data.Name + " (" + data.ID + ")"
                });

                item.groupID = data.ID + "," + data.Name;
                item.url = "/chaise/record/#2/Vocabulary:Anatomy/ID=" + id;
                item.name = data.Name;
            })
        }

        function changeStatus(item, key){
            var column = $rootScope.reference.columns.find(col => {
                if(col.isForeignKey){
                    return col.foreignKey.colset.columns[0].name === key;
                }
            });

            if(!column){
                return;
            }

            vm.searchPopup(column, function(tuple){
                var data = tuple._data;
                if(item.hasOwnProperty(key)){
                    item[key] = data.Name;
                }
                console.log(data);
                // var id = fixedEncodeURIComponent(data.ID);
                
                // AnnotationsService.changeGroupInfo({
                //     svgID : item.svgID,
                //     groupID : item.groupID,
                //     newGroupID : data.ID + "," + data.Name,
                //     newAnatomy : data.Name + " (" + data.ID + ")"
                // });

                // item.groupID = data.ID + "," + data.Name;
                // item.url = "/chaise/record/#2/Vocabulary:Anatomy/ID=" + id;
                // item.name = data.Name;
            })
        }

        function addNewTerm(){
            vm.searchPopup($rootScope.reference.columns[1], function(tuple){
                var svgID = vm.viewerModel.rows.length > 0 ? vm.viewerModel.rows[0].svgID : Date.parse(new Date()) + parseInt(Math.random() * 10000);
                var data = tuple._data;
                var groupInfo = {
                    svgID : svgID,
                    groupID : data.ID + "," + data.Name,
                    anatomy : data.Name + " (" + data.ID + ")",
                    description : data.Description,
                }

                if(checkAnatomyIDExist(data.ID)){
                    AlertsService.addAlert("This Anatomy ID already exists, please select other terms.", "warning");
                    return;
                }

                AnnotationsService.addNewTerm(groupInfo);
                vm.addAnnotation([groupInfo]);
            })
        }

        /**
         * click the setting icon to open the setting panel for the specific annotation
         * @param {*} item : the annotation object  
         * @param {*} event 
         */
        function manageSetting(item, event){
            vm.settingAnnotation = item;
        }

        function updateRecord(item){
            console.log(item);
        }
    }]);
})();
