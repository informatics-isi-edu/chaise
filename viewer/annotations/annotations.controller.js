(function() {
    // 'use strict';

    angular.module('chaise.viewer')

    .controller('AnnotationsController', [
        'AlertsService', 'annotationCreateForm', 'annotationEditForm',
        'AnnotationsService', 'context',
        'ConfigUtils', 'errorMessages', 'ErrorService', 'UriUtils', 'modalUtils',
        'recordCreate', 'logService', 'annotationModels',
        'viewerConfig', 'viewerConstant', 'viewerAppUtils',
        '$q', '$rootScope','$scope', '$timeout', '$window',
        function AnnotationsController(
            AlertsService, annotationCreateForm, annotationEditForm,
            AnnotationsService, context,
            ConfigUtils, errorMessages, ErrorService, UriUtils, modalUtils ,
            recordCreate, logService, annotationModels,
            viewerConfig, viewerConstant, viewerAppUtils,
            $q, $rootScope, $scope, $timeout, $window) {

        var chaiseConfig = ConfigUtils.getConfigJSON();
        var annotConfig = viewerConfig.getAnnotationConfig();
        var idColName = annotConfig.annotated_term_id_column_name,
            nameColName = annotConfig.annotated_term_name_column_name;
        var vm = this;

        vm.annotationCreateForm = annotationCreateForm;
        vm.annotationEditForm = annotationEditForm;
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
        vm.shareAnnotation = shareAnnotation;

        vm.addNewTerm = addNewTerm;
        vm.changeAllAnnotationsVisibility = changeAllAnnotationsVisibility;
        vm.changeStrokeScale = changeStrokeScale;
        vm.changeStrokeScaleStart = changeStrokeScaleStart;
        vm.changeStrokeScaleStop = changeStrokeScaleStop;
        vm.clearSearch = clearSearch;
        vm.closeAnnotationForm = closeAnnotationForm;
        vm.drawAnnotation = drawAnnotation;
        vm.editAnatomyAnnotations = editAnatomyAnnotations;
        vm.highlightGroup = highlightGroup;
        vm.removeAnnotationEntry = removeAnnotationEntry;
        vm.search = search;
        vm.saveAnnotationRecord = saveAnnotationRecord;
        vm.toggleDisplay = toggleDisplay;

        // we have to make sure the main image is loaded before
        // asking osd to update the annotations,
        // so there's a race-condition between annotation request
        // and main image load time, and we have to make sure
        // we're only loading time if both conidtions are met.
        var mainImageLoaded = false,
            annotationsRecieved = true; // we're loading the annotations as part of viewer app run block

        // Listen to events of type 'message' (from Annotorious)
        $window.addEventListener('message', function annotationControllerListener(event) {
            // TODO: Check if origin is valid first; if not, return and exit.
            // Do this for the other listeners as well.
            if (event.origin === window.location.origin) {
                var data = event.data;
                var messageType = data.messageType;
                // console.log("event received : ", event);
                switch (messageType) {
                    case "mainImageLoadFailed":
                        $scope.$apply(function () {
                            AlertsService.addAlert(errorMessages.viewerOSDFailed, "error");

                            $rootScope.loadingAnnotations = false;
                        });
                        break;
                    case 'mainImageLoaded':
                        mainImageLoaded= true;

                        if (annotationsRecieved) {
                            AnnotationsService.loadAnnotations($rootScope.annotationURLs);
                        }
                        break;
                    case 'updateMainImage':
                        $scope.$apply(function () {
                            // change defaultZIndex
                            context.defaultZIndex = data.content.zIndex;


                            // make sure it's not in edit/create mode
                            if (vm.editingAnatomy != null) {
                                vm.closeAnnotationForm();
                            }

                            // remove the existing annotations
                            annotationModels = [];
                            vm.annotationModels = annotationModels;
                            updateDisplayNum();

                            mainImageLoaded = false;
                            annotationsRecieved = false;
                            $rootScope.loadingAnnotations = true;

                            // read annotations
                            (function (currZIndex) {
                                viewerAppUtils.readAllAnnotations().then(function () {
                                    // if main image changed while fetching annotations, ignore it
                                    if (currZIndex != context.defaultZIndex) {
                                        console.log('ignoring stale annotation data');
                                        return;
                                    }

                                    annotationsRecieved = true;

                                    // if ($rootScope.annotationTuples.length == 0 && !$rootScope.canCreate) {
                                    //     $rootScope.disableAnnotationSidebar = true;
                                    //     $rootScope.hideAnnotationSidebar = true;
                                    // } else {
                                    //     $rootScope.disableAnnotationSidebar = false;
                                    // }

                                    if ($rootScope.annotationTuples.length > 0) {
                                        // ask osd to load the annotation
                                        if (mainImageLoaded) {
                                            AnnotationsService.loadAnnotations($rootScope.annotationURLs);
                                        }
                                    } else {
                                        $rootScope.loadingAnnotations = false;
                                    }
                                }).catch(function (err) {
                                    // if main image changed while fetching annotations, ignore it
                                    if (currZIndex != context.defaultZIndex) return;

                                    $rootScope.loadingAnnotations = false;
                                    // $rootScope.disableAnnotationSidebar = true;

                                    // fail silently
                                    console.log("erro while updating annotations ", err);
                                });
                            })(data.content.zIndex);
                        });
                        break;
                    case 'annotationsLoaded':
                        $scope.$apply(function(){
                            $rootScope.loadingAnnotations = false;
                        });
                        break;
                    case "onClickChangeSelectingAnnotation":
                        $scope.$apply(function(){
                            var svgID = data.content.svgID,
                                groupID = data.content.groupID;

                            // make sure the sidebar is displayed
                            $rootScope.hideAnnotationSidebar = false;

                            item = vm.annotationModels.find(function(item){
                                return item.svgID == svgID && item.groupID == groupID;
                            })
                            // if user clicks on a drawing during annotation
                            if (!item) return;
                            scrollIntoView(item.svgID + item.groupID);
                            changeSelectingAnnotation(item);

                        })
                        break;
                    case "onChangeStrokeScale":
                        $scope.$apply(function(){
                            vm.strokeScale = +data.content.strokeScale.toFixed(2);
                        });
                        break;
                    case "updateAnnotationList":
                        $scope.$apply(function(){
                            _addAnnotationToList(data.content);
                            updateDisplayNum();
                        })
                        break;
                    case "saveGroupSVGContent":
                        $scope.$apply(function(){
                            saveAnatomySVGFile(data);
                        });
                        break;
                    case 'errorAnnotation':
                        AlertsService.addAlert("Couldn't parse the given annotation.", "warning");
                        console.log("annotation error: ", data);
                        break;
                }
            } else {
                console.log('Invalid event origin. Event origin: ', event.origin, '. Expected origin: ', window.location.origin);
            }
        });

        // Scroll a DOM element into visible part of the browser
        function scrollIntoView(elementId) {
            var container = angular.element(document.getElementsByClassName('annotation-list-container')[0]);
            var el = angular.element(document.getElementById(elementId));

            // the elements might not be available
            if (el.length === 0 || container.length === 0) return;

            container.scrollToElementAnimated(el, 5).then(function () {
                // we're not doing anything after the scroll is done
            }).catch(function(err) {
                //it will be rejected only if scroll is cancelled
                //we don't need to handle the rejection, so we can fail silently.
            });
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

                // TOOD should be more systematic
                var contextHeaderParams = ConfigUtils.getContextHeaderParams();
                var url = "/chaise/record/#" + context.catalogID;
                url += "/" + UriUtils.fixedEncodeURIComponent(annotConfig.annotated_term_table_schema_name) + ":" + UriUtils.fixedEncodeURIComponent(annotConfig.annotated_term_table_name);
                url += "/" + UriUtils.fixedEncodeURIComponent(annotConfig.annotated_term_id_column_name) + "=" + UriUtils.fixedEncodeURIComponent(id);
                url += "?pcid=" + contextHeaderParams.cid + "&ppid=" + contextHeaderParams.pid;

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
                    tuple: null,
                    stroke: Array.isArray(items[i].stroke) ? items[i].stroke : []
                };

                row = $rootScope.annotationTuples.find(function (tuple, index) {
                    return tuple.data && tuple.data[annotConfig.annotated_term_column_name] === id;
                });

                // if row with same anatomy id exists in the viewer model -> update it
                if(row){
                    obj.isStoredInDB = true;
                    obj.tuple = row;
                    obj.canUpdate = row.canUpdate;
                    obj.canDelete = row.canDelete;

                    obj.logStackNode = logService.getStackNode(
                        logService.logStackTypes.ANNOTATION,
                        row.reference.table,
                        row.reference.filterLogInfo
                    );
                } else {
                    obj.logStackNode = logService.getStackNode(
                        logService.logStackTypes.ANNOTATION,
                        null,
                        {"file": 1}
                    );
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
            annotationCreateForm.logStack = AnnotationsService.getAnnotationLogStack();
            annotationCreateForm.logStackPath = AnnotationsService.getAnnotationLogStackPath(true);

            $rootScope.logAppMode = logService.appModes.CREATE;

            recordCreate.populateCreateModelValues(
                annotationCreateForm,
                annotationCreateForm.reference,
                null,
                null
            );

            // Set it to show the setting panel
            vm.editAnatomyAnnotations(newAnnotation);

            // Notify OSD to create a new svg and group for annotations
            AnnotationsService.addNewTerm({
                svgID : "NEW_SVG",
                groupID : "NEW_GROUP",
                anatomy : "",
                description : ""
            });

            // log the client action
            AnnotationsService.logAnnotationClientAction(logService.logActions.ADD_INTEND);
        }

        // Click to toggle overlay visibility in Openseadragon
        function changeAllAnnotationsVisibility(){
            vm.isDisplayAll = !vm.isDisplayAll;
            vm.annotationModels.forEach(function(item){
                item.isDisplay = vm.isDisplayAll;
            });
            AnnotationsService.changeAllAnnotationVisibility({
                isDisplay : vm.isDisplayAll
            });

            var action = vm.isDisplayAll ? logService.logActions.VIEWER_ANNOT_DISPLAY_ALL : logService.logActions.VIEWER_ANNOT_DISPLAY_NONE;
            AnnotationsService.logAnnotationClientAction(action);
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


        // log the stroke change:
        var strokeScalePromise = null, oldStrokeScale = null;
        function changeStrokeScaleStart() {
            // cancel any existing timeout
            if (strokeScalePromise) {
                $timeout.cancel(strokeScalePromise);
            }
            // save the starting value
            else {
                oldStrokeScale = vm.strokeScale;
            }
        }
        function changeStrokeScaleStop() {
            // set a timer to log the action
            strokeScalePromise = $timeout(function() {
                if (oldStrokeScale != vm.strokeScale) {
                    AnnotationsService.logAnnotationClientAction(
                        logService.logActions.VIEWER_ANNOT_LINE_THICKNESS,
                        null,
                        {
                            old_thickness: oldStrokeScale,
                            new_thickness: vm.strokeScale
                        }
                    );
                }

                oldStrokeScale = null;
                strokeScalePromise = null;
            }, viewerConstant.annotation.LINE_THICKNESS_LOG_TIMEOUT);
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
            if (columnModel.column.name !== annotConfig.annotated_term_visible_column_name) {
                return true;
            }

            var item = vm.editingAnatomy,
                data = tuple.data;

            // allow itself to be selected, but there's no reason to update the info
            if (data[idColName] === item.id) {
                return true;
            }

            // manually make sure the ID doesn't exist in the list,
            // because some of the annotations might not be stored in the database
            if(vm.annotationModels.find(function (row) { return row.id === data[idColName]})){
                return {error: true, message: "An annotation already exists for this Anatomy, please select other terms."};
            }

            // Update the new Anatomy name and ID at openseadragon viewer
            AnnotationsService.changeGroupInfo({
                svgID : item.svgID,
                groupID : item.groupID,
                newGroupID : data[idColName] + "," + data[nameColName],
                newAnatomy : data[nameColName] + " (" + data[idColName] + ")"
            });

            // TODO should be part of a prototype (this is done twice)
            var contextHeaderParams = ConfigUtils.getContextHeaderParams();
            var url = "/chaise/record/#" + context.catalogID;
            url += "/" + UriUtils.fixedEncodeURIComponent(annotConfig.annotated_term_table_schema_name) + ":" + UriUtils.fixedEncodeURIComponent(annotConfig.annotated_term_table_name);
            url += "/" + UriUtils.fixedEncodeURIComponent(annotConfig.annotated_term_id_column_name) + "=" + UriUtils.fixedEncodeURIComponent(data[idColName]);
            url += "?pcid=" + contextHeaderParams.cid + "&ppid=" + contextHeaderParams.pid;

            item["anatomy"] = data[nameColName] + " (" + data[idColName] + ")";
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
         * Image -> Anatomy
         * so we do a call to schema:Anatomy/<facet that goes to Image_Annotation, image=context.imageID, z_index=context.defaultZIndex>
         */
        function getAnnotatedTermDisabledTuples (columnModel) {
            if (columnModel.column.name !== annotConfig.annotated_term_visible_column_name) {
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

                // TODO should be done in ermrestjs
                var existingRefURL = chaiseConfig.ermrestLocation + "/catalog/" + context.catalogID + "/entity/";
                existingRefURL += UriUtils.fixedEncodeURIComponent(annotConfig.annotated_term_table_schema_name) + ":";
                existingRefURL += UriUtils.fixedEncodeURIComponent(annotConfig.annotated_term_table_name) + "/";

                // image value
                var facet = {and: []};
                facet.and[0] = {
                    choices: [context.imageID]
                }
                facet.and[0].source = [{"inbound": annotConfig.annotated_term_foreign_key_constraint}];
                facet.and[0].source.push(annotConfig.reference_image_column_name);

                //z index value
                if (context.defaultZIndex != null) {
                    facet.and.push({
                        choices: [context.defaultZIndex]
                    })
                    facet.and[1].source = [{"inbound": annotConfig.annotated_term_foreign_key_constraint}];
                    facet.and[1].source.push(annotConfig.z_index_column_name);
                }

                existingRefURL += "*::facets::" + ERMrest.encodeFacet(facet);

                ERMrest.resolve(existingRefURL, ConfigUtils.getContextHeaderParams()).then(function (ref) {
                    // TODO properly pass logObj
                    return ref.contextualize.compactSelect.setSamePaging(page).read(pageSize, logObj, false, true);
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

            // log the client action
            AnnotationsService.logAnnotationClientAction(logService.logActions.SEARCH_BOX_CLEAR);
        }

        /**
         * Close the annotation metadata panel
         */
        function closeAnnotationForm(confirm){
            var item = vm.editingAnatomy;

            var close = function () {
                vm.annoForm.$setPristine();
                vm.annoForm.$setUntouched();

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

            // show confirmation on back button
            if (confirm) {
                modalUtils.showModal({
                    animation: false,
                    templateUrl:  UriUtils.chaiseDeploymentPath() + "common/templates/confirmation.modal.html",
                    controller: "ConfirmModalController",
                    controllerAs: "ctrl",
                    size: "sm",
                    resolve: {
                        params: {
                            buttonAction: "Ok",
                            message: "Any unsaved change will be discarded. Do you want to continue?"
                        }
                    }
                }, function () {
                    if (!item.isNew) {
                        // if anatomy has changed, change it back
                        if (item.originalAnnotatedTermData && item.originalAnnotatedTermData.groupID != item.groupID) {
                            // signal osd to change the groupID back
                            AnnotationsService.changeGroupInfo({
                                svgID : item.svgID,
                                groupID : item.groupID,
                                newGroupID : item.originalAnnotatedTermData.groupID,
                                newAnatomy : item.originalAnnotatedTermData.anatomy
                            });

                            // change the extra attributes back
                            for (var k in item.originalAnnotatedTermData) {
                                item[k] = item.originalAnnotatedTermData[k];
                            }
                        }

                        // send a message to osd viewer to cancel
                        AnnotationsService.discardAnnotationChange({
                            svgID: item.svgID,
                            groupID: item.groupID
                        });
                    }

                    close();
                }, null, false);
            } else {
                close();
            }

        }

        /**
         * Click to open drawing tool for anatomy's annotations
         * @param {object} item : the anatomy's annotations object
         * @param {object} event : click event object
         */
        function drawAnnotation(item, event, changeColor) {

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
                mode : (vm.editingAnatomy.isDrawing) ? "ON" : "OFF",
                setStroke: (changeColor === true) // change the color that is used in toolbar
            });

            if (event) {
                // log the client action
                var action = logService.logActions.VIEWER_ANNOT_DRAW_MODE_HIDE;
                if (vm.editingAnatomy.isDrawing) {
                    action = logService.logActions.VIEWER_ANNOT_DRAW_MODE_SHOW;
                }
                AnnotationsService.logAnnotationClientAction(action, item);

                event.stopPropagation();
            }
        }

        /**
         * this callback will be fired when users try to navigate away from the page
         * NOTE custom message is not supported by modern browsers anymore, but
         *      for consistency I've added it.
         */
        function _leaveAlertEvent(e) {
            // make sure annotation panel is open
            if (vm.editingAnatomy != null) {
                e.returnValue = "Any unsaved change will be discarded. Do you want to continue?";
            }
        }

        /**
         * register the _leaveAlertEvent
         * Done when users open the edit/create form
         */
        function _registerLeaveAlertListener() {
            window.addEventListener("beforeunload", _leaveAlertEvent);
        }

        /**
         * destroy the _leaveAlertEvent
         * Done when we close the edit/create form
         */
        function _destroyLeaveAlertListener() {
            window.removeEventListener("beforeunload", _leaveAlertEvent);
        }

        /**
         * click the setting icon to open the setting panel for the specific annotation,
         * or when in the controller we want to switch to/from form
         * @param {object} item : the anatomy's annotations object
         */
        function editAnatomyAnnotations(item, index, event){
            if(event){
                event.stopPropagation();

                // unselect (unhighlight) the annotation
                if (item && item.isSelected) {
                    highlightGroup(item);
                }
            }

            vm.editingAnatomy = item || null;
            vm.editingAnatomyIndex = (typeof index == 'number') ? index : -1;
            vm.showPanel = (item !== null) ? true : false;

            // only in edit mode
            if (typeof index == 'number') {
                // TODO is this unnecessary?
                annotationEditForm.rows = [{}];
                annotationEditForm.canUpdateRows = [{}];
                annotationEditForm.submissionRows = [{}];
                annotationEditForm.foreignKeyData = [{}];
                annotationEditForm.oldRows = [{}];
                annotationEditForm.logStack = AnnotationsService.getAnnotationLogStack(!item.tuple ? null : item);
                annotationEditForm.logStackPath = AnnotationsService.getAnnotationLogStackPath(!item.tuple ? true : item);

                // TODO if the data is not in database, the form is create right? default values etc.
                if (!item.tuple) {
                    $rootScope.logAppMode = logService.appModes.CREATE_PRESELECT;
                    var values = {};
                    values[annotConfig.annotated_term_column_name] = item.id;
                    recordCreate.populateCreateModelValues(
                        annotationEditForm,
                        annotationEditForm.reference,
                        null,
                        values
                    );
                } else {
                    // log the client action
                    AnnotationsService.logAnnotationClientAction(logService.logActions.EDIT_INTEND, item);

                    $rootScope.logAppMode = logService.appModes.EDIT;
                    recordCreate.populateEditModelValues(
                        annotationEditForm,
                        annotationEditForm.reference,
                        item.tuple,
                        0,
                        false
                    );
                }

                // TODO all these attributes related to anatmoy should go to one place
                // keep the original values in case they are changed by the user
                item.originalAnnotatedTermData = {
                    groupID: item.groupID,
                    anatomy: item.anatomy,
                    name: item.name,
                    id: item.id,
                    url: item.url
                };

                // send a message to osd viewer to signal the start of edit
                AnnotationsService.startAnnotationChange({
                    svgID: item.svgID,
                    groupID: item.groupID
                });
            }

            // if item is null, we just wanted to switch away from edit/create mode
            if (item != null) {
                // switch to drawing mode by default
                vm.drawAnnotation(vm.editingAnatomy, null, true);


                // make sure users are warned that data might be lost
                _registerLeaveAlertListener();
            } else {

                // we don't need the warning event listener anymore
                _destroyLeaveAlertListener();

                $rootScope.logAppMode = null;
            }

            vm.displayDrawingRequiredError = false;
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
         * Open a share dialog for the given annotation
         */
        function shareAnnotation (item, index, event) {
            // make sure it's highlighted
            if (!item.isSelected) {
                highlightGroup(item);
            }

            // TODO could be refactored
            var url = "/chaise/record/#" + context.catalogID;
            url += "/" + UriUtils.fixedEncodeURIComponent(annotConfig.schema_name) + ":" + UriUtils.fixedEncodeURIComponent(annotConfig.table_name);
            url += "/RID=" + UriUtils.fixedEncodeURIComponent(item.tuple.data.RID);

            var moreInfo = {
                logStack: AnnotationsService.getAnnotationLogStack(item),
                logStackPath: AnnotationsService.getAnnotationLogStackPath(item),
                title: "Share Annotation",
                hideHeader: true,
                hideCitation: true,
                extraInformation: [
                    {
                        title: "RID",
                        value: item.tuple.data.RID,
                        link: url,
                        type: "link"
                    },
                    {
                        title: annotConfig.annotated_term_displayname,
                        value: item.name + (item.id ? (" (" + item.id + ")") : "")
                    }
                ]
            };

            // to disable all the share buttons
            vm.waitingForSharePopup = true;

            // to show the loader
            item.waitingForSharePopup = true;

            modalUtils.openSharePopup(item.tuple, $rootScope.annotationEditReference, moreInfo).then(function () {
                if (!item.isSelected) {
                    highlightGroup(item);
                }
                vm.waitingForSharePopup = false;
                item.waitingForSharePopup = false;
            }).catch(function () {
                //
            });

            event.stopPropagation();
            event.preventDefault();
        }

        /**
         * Click to highlight the anatomy's annotations
         * @param {obejct} item : the anatomy's annotations object
         * @param {object} event : click event object
         */
        function highlightGroup(item, event){
            changeSelectingAnnotation(item);
            // Unhide the annotation if it's hidden
            if(!item.isDisplay){
                vm.toggleDisplay(item);
            }
            // Notify openseadragon to highlight the annotations
            AnnotationsService.highlightAnnotation({
                svgID : item.svgID,
                groupID : item.groupID
            });

            // event is only passed if user initiated the highlight
            if (event) {
                // log the client action
                if (item.isSelected) {
                    AnnotationsService.logAnnotationClientAction(logService.logActions.VIEWER_ANNOT_HIGHLIGHT, item);
                }

                event.stopPropagation();
            }
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

            // log intend
            AnnotationsService.logAnnotationClientAction(logService.logActions.DELETE_INTEND, item);

            modalUtils.showModal({
                animation: false,
                templateUrl:  UriUtils.chaiseDeploymentPath() + "common/templates/delete-link/confirm_delete.modal.html",
                controller: "ConfirmDeleteController",
                controllerAs: "ctrl",
                resolve: {
                    params: { count: 1 }
                },
                size: "sm"
            }, function onSuccess(res) {
                vm.submissionButtonDisabled = true;
                AnnotationsService.removeEntry(item).then(function(){
                    vm.submissionButtonDisabled = false;

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
                        updateDisplayNum();

                        // remove svg object from openseadragon
                        if(item.svgID){
                            AnnotationsService.removeSVG({svgID : item.svgID});
                        }

                        // close the current panel
                        vm.closeAnnotationForm();
                    }
                }).catch(function (err) {
                    vm.submissionButtonDisabled = false;
                    ErrorService.handleException(err, true);
                });
            }, function () {
                // log cancel
                AnnotationsService.logAnnotationClientAction(logService.logActions.DELETE_CANCEL, item);
            }, false);
        }

        // Search based on the keyword
        var searchPromise = null;
        function search(){
            updateDisplayNum();

            // if a log promise is already fired, remove it
            if (searchPromise) {
                $timeout.cancel(searchPromise);
            }

            // create a timeout to log the search
            searchPromise = $timeout(function () {
                if (vm.searchKeyword) {
                    AnnotationsService.logAnnotationClientAction(
                        logService.logActions.SEARCH_BOX_AUTO,
                        null,
                        {
                            search_str: vm.searchKeyword
                        }
                    );
                }
                searchPromise = null;
            }, viewerConstant.annotation.SEARCH_LOG_TIMEOUT);
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
            } else {
                vm.displayDrawingRequiredError = false;
            }

            if(noAnnot || vm.annoForm.$invalid){
                _displaySubmitError();
                return;
            }

            var formModel = vm.editingAnatomy.isNew ? annotationCreateForm : annotationEditForm,
                isUpdate = !vm.editingAnatomy.isNew && vm.editingAnatomy.isStoredInDB,
                originalTuple = null,
                imageRID = context.imageID,
                savedItem = vm.editingAnatomy,
                fileName,
                file,
                logObj;

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
            fileName = imageRID + "_" + formModel.submissionRows[0][annotConfig.annotated_term_column_name];
            if (context.defaultZIndex != null) {
                fileName += "_z" + context.defaultZIndex;
            }
            file = new File([data.content[0].svg], fileName + ".svg", {
                type : "image/svg+xml"
            });

            // add the image value
            formModel.submissionRows[0][annotConfig.reference_image_column_name] = imageRID;

            // add the default z index value
            if (context.defaultZIndex != null) {
                formModel.submissionRows[0][annotConfig.z_index_column_name] = context.defaultZIndex;
            }

            // change the overlay file value
            formModel.submissionRows[0][annotConfig.overlay_column_name] = {
                uri : fileName,
                file : file,
                fileName : fileName,
                fileSize : file.size,
                hatracObj : new ERMrest.Upload(file, {
                    column: formModel.reference.columns.find(function (column) {return column.name == annotConfig.overlay_column_name}),
                    reference: formModel.reference
                })
            };

            var action = vm.editingAnatomy.isNew ? logService.logActions.CREATE : logService.logActions.UPDATE;
            logObj = {
                action: AnnotationsService.getAnnotationLogAction(action, savedItem),
                stack: AnnotationsService.getAnnotationLogStack(savedItem)
            };

            // show the spinner
            vm.submissionButtonDisabled = true;

            // TODO why pass vm??
            // TODO the last element is logObject, should be changed later...
            recordCreate.addRecords(isUpdate, null, formModel, false, formModel.reference, [originalTuple], {}, vm, function (formModel, result) {
                vm.submissionButtonDisabled = true;

                var afterMutation = function (tuple) {

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
                    savedItem.canUpdate = tuple.canUpdate;
                    savedItem.canDelete = tuple.canDelete;
                    savedItem.isStoredInDB = true;
                    savedItem.isNew = false;

                    // update the color
                    savedItem.stroke = data.content[0].stroke;

                    // update the annotationModels
                    var rowIndex = vm.editingAnatomyIndex;
                    if (rowIndex !== -1) { // it's part of the form
                        vm.annotationModels[rowIndex] = savedItem;
                    } else { // should be added to the form
                        vm.annotationModels.push(savedItem);
                    }

                    updateDisplayNum();
                    vm.closeAnnotationForm();
                    vm.submissionButtonDisabled = false;

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

                // update the stacknode
                savedItem.logStackNode = logService.getStackNode(
                    logService.logStackTypes.ANNOTATION,
                    resultTuple.reference.table,
                    resultTuple.reference.filterLogInfo
                );

                // populate the logobject for the read request
                logObj = {
                    action: AnnotationsService.getAnnotationLogAction(logService.logActions.VIEWER_ANNOT_FETCH, savedItem),
                    stack: AnnotationsService.getAnnotationLogStack(savedItem)
                };

                // read the currently saved data, so we can capture the tuple in correct context
                // arguments that are true:
                //  - dontCorrect page
                //  - getTCRS: since we're using this tuple for getting the update/delete permissions and also populating edit form
                resultTuple.reference.contextualize.entryEdit.read(1, logObj, false, true, false, true).then(function (page) {
                    if (page.length != 1) {
                        console.log("the currently added row was not visible.");
                    }
                    afterMutation(page.length == 1 ? page.tuples[0] : resultTuple);
                }).catch(function (err) {
                    console.log("error while reading after create/update:", err);
                    afterMutation(resultTuple);
                });
            }, logObj);
        }

        /**
         * Notfiy openseadragon to export the editing anatomy's annotations before saving
         * @param {object} item : the editing anatomy's annotations object
         */
        function saveAnnotationRecord(item){
            vm.displayDrawingRequiredError = false;
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
                // log the client action
                var action = item.isDisplay ? logService.logActions.VIEWER_ANNOT_SHOW : logService.logActions.VIEWER_ANNOT_HIDE;
                AnnotationsService.logAnnotationClientAction(action, item);

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
                if(filterAnnotations(item)){
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
