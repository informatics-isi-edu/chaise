(function () {
    'use strict';

    angular.module('chaise.ellipsis', ['chaise.utils'])

    .directive('ellipsis', ['AlertsService', 'ConfigUtils', 'defaultDisplayname', 'ERMrest', 'ErrorService', 'logService', 'MathUtils', 'messageMap', 'modalBox', 'modalUtils', 'recordsetDisplayModes', 'recordTableUtils', 'Session', 'UiUtils', 'UriUtils', '$log', '$rootScope', '$sce', '$timeout', '$window',
        function(AlertsService, ConfigUtils, defaultDisplayname, ERMrest, ErrorService, logService, MathUtils, messageMap, modalBox, modalUtils, recordsetDisplayModes, recordTableUtils, Session, UiUtils, UriUtils, $log, $rootScope, $sce, $timeout, $window) {
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
                        resolve: {
                            params: { count: 1 }
                        },
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
                onFavoritesChanged: '=?',
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

                    recordTableUtils.registerFavoritesCallbacks(scope);

                    scope.isFavoriteLoading = false;
                    scope.callToggleFavorite = function () {
                        if (scope.isFavoriteLoading) return;
                        scope.isFavoriteLoading = true;
                        scope.toggleFavorite(scope.tuple.data, scope.tuple.reference.table, scope.tuple.isFavorite).then(function (isFavorite) {
                            // attached value is to the tuple
                            // TODO: this should be changed but it was the only value shared between ellipsis
                            //    and when I read in the data for setting favorites
                            scope.tuple.isFavorite = isFavorite;
                        }, function (isFavorite) {
                            scope.tuple.isFavorite = isFavorite;
                        }).catch(function (error) {
                            $log.warn(error);
                        }).finally(function () {
                            scope.isFavoriteLoading = false;
                            if (scope.onFavoritesChanged) {
                                scope.onFavoritesChanged();
                            }
                        });
                    }

                    scope.tooltip = {};

                    var tupleReference = scope.tuple.reference,
                        isRelated = scope.config.displayMode.indexOf(recordsetDisplayModes.related) === 0,
                        editLink = null,
                        isSavedQueryPopup = scope.config.displayMode === recordsetDisplayModes.savedQuery,
                        associationRef;

                    // apply saved query link
                    // show the apply saved query button for (compact/select savedQuery popup)
                    if (isSavedQueryPopup) {
                        // NOTE: assume relative to reference the user is viewing
                        // encoded_facets column might not be a part of the rowValues so get from tuple.data (prevents formatting being applied as well)
                        // some queries might be saved withoug any facets selected meaning this shouldn't break
                        var facetString = scope.tuple.data.encoded_facets ? "/*::facets::" + scope.tuple.data.encoded_facets : "";
                        var ermrestPath = scope.tableModel.parentReference.unfilteredReference.uri + facetString;
                        ERMrest.resolve(ermrestPath, ConfigUtils.getContextHeaderParams()).then(function (savedQueryRef) {
                            var savedQueryLink = savedQueryRef.contextualize.compact.appLink;
                            var qCharacter = savedQueryLink.indexOf("?") !== -1 ? "&" : "?";
                            // TODO: change from HTML link to refresh page to:
                            //    "updateFacets on main entity and add to browser history stack"
                            // after update, put last_execution_time as "now"
                            scope.applySavedQuery = savedQueryLink + qCharacter + "savedQueryRid=" + scope.tuple.data.RID + "&paction=" + logService.pactions.APPLY_SAVED_QUERY;
                        }).catch(function (error) {
                            $log.warn(error);
                            // fail silently and degrade the UX (hide the apply button)
                            // show the disabled apply button
                            scope.applySavedQuery = false;
                        });
                    } else {
                        // hide the apply button completely
                        scope.applySavedQuery = null;
                    }

                    // view link
                    if (scope.config.viewable) {
                        var viewLink = tupleReference.contextualize.detailed.appLink;
                        var qCharacter = viewLink.indexOf("?") !== -1 ? "&" : "?";
                        scope.viewLink = viewLink + qCharacter + "paction=" + logService.pactions.VIEW;
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
                    if (scope.config.editable && scope.tuple.canUpdate) {
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
                            if (scope.tuple.canUnlink) {
                                scope.tooltip.unlink = "'Disconnect <code>" + scope.tableModel.reference.displayname.value + "</code>: <code>" + scope.tuple.displayname.value + "</code> from this <code>" + scope.tableModel.parentReference.displayname.value + "</code>.'";
                                // define unlink function
                                scope.unlink = function() {
                                    deleteReference(scope, associationRef, isRelated, true);
                                };
                            }
                        }
                        else if (scope.tuple.canDelete) {
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
            }
        };
    }])


})();
