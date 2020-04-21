(function () {
    'use strict';

    angular.module('chaise.ellipsis', ['chaise.utils'])

    .filter('trustedHTML', ['$sce', function($sce){
        return function(text) {
            return $sce.trustAsHtml(text);
        };
    }])

    .directive('ellipsis', ['AlertsService', 'ConfigUtils', 'defaultDisplayname', 'ErrorService', 'logService', 'MathUtils', 'messageMap', 'modalBox', 'modalUtils', 'recordsetDisplayModes', 'recordTableUtils', 'Session', 'UiUtils', 'UriUtils', '$log', '$rootScope', '$sce', '$timeout', '$window',
        function(AlertsService, ConfigUtils, defaultDisplayname, ErrorService, logService, MathUtils, messageMap, modalBox, modalUtils, recordsetDisplayModes, recordTableUtils, Session, UiUtils, UriUtils, $log, $rootScope, $sce, $timeout, $window) {
        var chaiseConfig = ConfigUtils.getConfigJSON(),
            context = ConfigUtils.getContextJSON();

        function containerDetails(scope) {
            return {
                displayMode: scope.config.displayMode,
                containerIndex: scope.config.containerIndex
            };
        }

        function getLogAction(scope, actionVerb) {
            return recordTableUtils.getTableLogAction(scope.tableModel, logService.logStackPaths.ENTITY, actionVerb);
        }

        function deleteReference(scope, reference, isRelated, isUnlink) {
            Session.validateSessionBeforeMutation(function () {
                var logObj = {
                    action: getLogAction(scope, isUnlink ? logService.logActions.UNLINK : logService.logActions.DELETE),
                    stack: scope.logStack
                };
                var emmitedMessageArgs = {};
                if (isRelated) {
                    emmitedMessageArgs = containerDetails(scope);
                }

                if (chaiseConfig.confirmDelete === undefined || chaiseConfig.confirmDelete) {
                    var onError = function (response) {
                        scope.$root.showSpinner = false;

                        // log the opening of cancelation modal
                        logService.logClientAction({
                            action: getLogAction(scope, isUnlink ? logService.logActions.UNLINK_CANCEL : logService.logActions.DELETE_CANCEL),
                            stack: scope.logStack
                        }, reference.defaultLogInfo);

                        // if response is string, the modal has been dismissed
                        if (typeof response !== "string") {
                            ErrorService.handleException(response, true);  // throw exception for dismissible pop- up (error, isDismissible = true)
                        }
                    }

                    // log the opening of delete modal
                    logService.logClientAction({
                        action: getLogAction(scope, isUnlink ? logService.logActions.UNLINK_INTEND : logService.logActions.DELETE_INTEND),
                        stack: scope.logStack
                    }, reference.defaultLogInfo);

                    modalUtils.showModal({
                        animation: false,
                        templateUrl:  UriUtils.chaiseDeploymentPath() + "common/templates/delete-link/confirm_delete.modal.html",
                        controller: "ConfirmDeleteController",
                        controllerAs: "ctrl",
                        size: "sm"
                    }, function onSuccess(res) {
                        scope.$root.showSpinner = true;
                        // user accepted prompt to delete
                        reference.delete(logObj).then(function deleteSuccess() {
                            scope.$root.showSpinner = false;
                            // tell parent controller data updated
                            scope.$emit('record-deleted', emmitedMessageArgs);
                        }).catch(onError);
                    }, onError, false);
                } else {
                    scope.$root.showSpinner = true;
                    reference.delete(logObj).then(function deleteSuccess() {
                        scope.$root.showSpinner = false;
                        // tell parent controller data updated
                        scope.$emit('record-deleted', emmitedMessageArgs);

                    }).catch(function (error) {
                        scope.$root.showSpinner = false;
                        ErrorService.handleException(error, true); // throw exception for dismissible pop- up (error, isDismissible = true)
                    });
                }
            });
        }

        return {
            restrict: 'AE',
            templateUrl:  UriUtils.chaiseDeploymentPath() + 'common/templates/ellipsis.html',
            scope: {
                tuple: '=',
                rowValues: '=', // tuple's values
                rowIndex: '=', // tuple's row index in rowValues array
                onRowClickBind: '=?',
                selected: '=',
                selectDisabled: "=?",
                tableModel: "="
            },
            link: function (scope, element) {

                var init = function() {

                    scope.overflow = []; // for each cell in the row
                    scope.hideContent = false;
                    scope.linkText = "more";
                    scope.maxHeightStyle = { };

                    scope.noSelect = modalBox.noSelect;
                    scope.singleSelect = modalBox.singleSelectMode;
                    scope.multiSelect = modalBox.multiSelectMode;
                    scope.defaultDisplayname = defaultDisplayname;
                    scope.config = scope.tableModel.config;

                    var tupleReference = scope.tuple.reference,
                        isRelated = scope.config.displayMode.indexOf(recordsetDisplayModes.related) === 0,
                        associationRef;

                    // view link
                    if (scope.config.viewable) {
                        scope.viewLink = tupleReference.contextualize.detailed.appLink;
                    }

                    // if tupleReference is not defined
                    // this has been added for case of facet picker, in this case we don't want edit and delete links anyways.
                    if (!tupleReference) return;

                    // all the row level actions should use this stack
                    scope.logStack = recordTableUtils.getTableLogStack(
                        scope.tableModel,
                        logService.getStackNode(logService.logStackTypes.ENTITY, tupleReference.table, tupleReference.filterLogInfo)
                    );

                    // edit button
                    if (scope.config.editable && tupleReference.canUpdate) {
                        scope.edit = function () {
                            var id = MathUtils.getRandomInt(0, Number.MAX_SAFE_INTEGER);

                            var editLink = editLink = tupleReference.contextualize.entryEdit.appLink;
                            var qCharacter = editLink.indexOf("?") !== -1 ? "&" : "?";
                            $window.open(editLink + qCharacter + 'invalidate=' + UriUtils.fixedEncodeURIComponent(id), '_blank');

                            var args = {};
                            if (isRelated) {
                                args = containerDetails(scope);
                            }
                            args.id = id;
                            scope.$emit("edit-request", args);

                            logService.logClientAction({
                                action: getLogAction(scope, logService.logActions.EDIT_INTEND),
                                stack: scope.logStack
                            }, tupleReference.defaultLogInfo);
                        };
                    }

                    // unlink button should only show up in related mode
                    if (isRelated && scope.tableModel.parentTuple) {
                        associationRef = scope.tuple.getAssociationRef(scope.tableModel.parentTuple.data);
                    }

                    // delete/unlink button
                    if (scope.config.deletable) {
                        if (associationRef) {
                            if (associationRef.canDelete) {
                                // define unlink function
                                scope.unlink = function() {
                                    deleteReference(scope, associationRef, isRelated, true);
                                };
                            }
                        }
                        else if (tupleReference.canDelete) {
                            // define delete function
                            scope.delete = function() {
                                deleteReference(scope, tupleReference, isRelated);
                            };
                        }
                    }
                };

                // Initialize the action column btn links
                init();

                scope.onSelect = function($event) {
                    var args = {"tuple": scope.tuple};

                    // call the call-backs
                    if (scope.onRowClickBind) {
                        scope.onRowClickBind(args, $event);
                    } else if (scope.onRowClick) {
                        scope.onRowClick(args, $event);
                    }
                };

                // If chaiseconfig contains maxRecordSetHeight then apply more-less styling
                var userClicked = false, initializeOverflowLogic, removeCellSensors;
                if (chaiseConfig.maxRecordsetRowHeight != false ) {
                    var tdPadding = 10, // +10 to account for padding on TD
                        moreButtonHeight = 20,
                        maxHeight = chaiseConfig.maxRecordsetRowHeight || 160,
                        maxHeightStyle = { "max-height": (maxHeight - moreButtonHeight) + "px" },
                        cellSensors = {};

                    scope.readmore = function() {
                        userClicked = true; // avoid triggering resize Sensor logic
                        if (scope.hideContent) {
                            scope.hideContent = false;
                            scope.linkText = "less";
                            scope.maxHeightStyle =  { };
                        } else {
                            scope.hideContent = true;
                            scope.linkText = "more";
                            scope.maxHeightStyle =  maxHeightStyle;
                        }
                    };

                    var setOverflows = function () {
                        // Iterate over each <td> in the <tr>
                        // use length-1 because resizeSensor adds a div to end of children list of TDs
                        for (var i = 0; i < element[0].children.length-1; i++) {
                            var currentTD = element[0].children[i];

                            scope.overflow[i] = (currentTD.children[0].clientHeight + tdPadding) > maxHeight
                        }
                    }

                    var initializeOverflowLogic = function () {
                        setOverflows();

                        scope.hideContent = true;
                        scope.maxHeightStyle = maxHeightStyle;

                        scope.$digest();
                    }

                    // function to remove the cell sesnsors before adding new ones
                    // prevents having sensors on cells with no content
                    var removeCellSensors = function () {
                        for(var key in cellSensors) {
                            cellSensors[key].detach();
                        }
                        cellSensors = {};
                    }

                    new ResizeSensor(element[0], function (dimensions) {
                        // if TR.offsetHeight > the calculated maxRecordsetRowHeight
                        if (dimensions.height > (maxHeight + tdPadding)) {
                            // iterate over each cell (TD), check it's height, and set overflow if necessary
                            if (!userClicked) {
                                initializeOverflowLogic();
                            }
                        } else if (dimensions.height < (maxHeight + tdPadding)) {
                            scope.overflow = [];
                        }
                    });

                    // internalID is per table instance, rowIndex is per row in each table
                    $rootScope.$on('aggregate-loaded-' + scope.tableModel.internalID + "-" + scope.rowIndex, function(events, data) {
                        var columnModelIndex = data;
                        // +1 to account for the actions column
                        var columnUiIndex = columnModelIndex + 1;
                        var hasPostLoadClass = scope.rowValues[columnModelIndex].isHTML && scope.rowValues[columnModelIndex].value.indexOf('-chaise-post-load') > -1;

                        if (scope.tableModel.columnModels[columnModelIndex].column.hasAggregate && hasPostLoadClass) {
                            var aggTD = element[0].children[columnUiIndex];
                            cellSensors[columnModelIndex] = new ResizeSensor(aggTD, function (dimensions) {
                                // if TD.offsetHeight > the calculated maxRecordsetRowHeight
                                // +10 to account for padding on TD element
                                if (dimensions.height > (maxHeight)) {
                                    // iterate over each cell (TD), check it's height, and set overflow if necessary
                                    if (!userClicked) {
                                        initializeOverflowLogic();
                                    }
                                } else if (dimensions.height < (maxHeight)) {
                                    scope.overflow[2] = false;
                                }
                            });
                        }
                    });
                }

                // when the row data updates we have to:
                //  - run the init function to make sure functions for action columns point to proper reference
                //  - reset the overflow (truncation) logic
                $rootScope.$on('reference-modified', function() {
                    if (removeCellSensors) {
                        removeCellSensors();
                    }

                    $timeout(function () {
                        init();

                        userClicked = false;
                        if (initializeOverflowLogic) {
                            initializeOverflowLogic();
                        }
                    });
                });

            }
        };
    }])


})();
