(function () {
    'use strict';

    angular.module('chaise.ellipsis', ['chaise.utils'])

    .filter('trustedHTML', ['$sce', function($sce){
        return function(text) {
            return $sce.trustAsHtml(text);
        };
    }])

    .directive('ellipsis', ['AlertsService', 'ConfigUtils', 'defaultDisplayname', 'ErrorService', 'logActions', 'logService', 'MathUtils', 'messageMap', 'modalBox', 'modalUtils', 'recordsetDisplayModes', 'UiUtils', 'UriUtils', '$log', '$rootScope', '$sce', '$timeout', '$window',
        function(AlertsService, ConfigUtils, defaultDisplayname, ErrorService, logActions, logService, MathUtils, messageMap, modalBox, modalUtils, recordsetDisplayModes, UiUtils, UriUtils, $log, $rootScope, $sce, $timeout, $window) {
        var chaiseConfig = ConfigUtils.getConfigJSON(),
            context = ConfigUtils.getContextJSON();

        function deleteReference(scope, reference) {
            var logObject = {action: logActions.recordsetDelete};
            // if it's related mode, change the logObject
            if (scope.displayMode.indexOf(recordsetDisplayModes.related) === 0) {
                logObject = {
                    action: logActions.recordRelatedDelete,
                    referrer: scope.parentReference.defaultLogInfo
                };
            }

            if (chaiseConfig.confirmDelete === undefined || chaiseConfig.confirmDelete) {
                var isRecordset = (scope.displayMode == recordsetDisplayModes.fullscreen),
                    isInline = (scope.displayMode == recordsetDisplayModes.inline);

                var action;
                if (isRecordset) {
                    action = logActions.deleteIntend;
                } else if (isInline) {
                    action = (scope.isUnLink ? logActions.inlineUnlinkIntend : logActions.inlineDeleteIntend );
                } else {
                    action = (scope.isUnLink ? logActions.relatedUnlinkIntend : logActions.relatedDeleteIntend );
                }

                var actionHeader = {
                    action: action,
                    facet: reference.defaultLogInfo.facet
                }

                var onError = function (response) {
                    scope.$root.showSpinner = false;

                    if (isRecordset) {
                        action = logActions.deleteCancel;
                    } else if (isInline) {
                        action = (scope.isUnLink ? logActions.inlineUnlinkCancel : logActions.inlineDeleteCancel );
                    } else {
                        action = (scope.isUnLink ? logActions.relatedUnlinkCancel : logActions.relatedDeleteCancel );
                    }

                    actionHeader.action = action;
                    logService.logClientAction(actionHeader, reference.defaultLogInfo);
                    // if response is string, the modal has been dismissed
                    if (typeof response !== "string") {
                        ErrorService.handleException(response, true);  // throw exception for dismissible pop- up (error, isDismissible = true)
                    }
                }

                logService.logClientAction(actionHeader, reference.defaultLogInfo);

                modalUtils.showModal({
                    animation: false,
                    templateUrl:  UriUtils.chaiseDeploymentPath() + "common/templates/delete-link/confirm_delete.modal.html",
                    controller: "ConfirmDeleteController",
                    controllerAs: "ctrl",
                    size: "sm"
                }, function onSuccess(res) {
                    scope.$root.showSpinner = true;
                    // user accepted prompt to delete
                    reference.delete(logObject).then(function deleteSuccess() {
                        scope.$root.showSpinner = false;
                        // tell parent controller data updated
                        scope.$emit('record-deleted');
                    }).catch(onError);
                }, onError, false);
            } else {
                scope.$root.showSpinner = true;
                reference.delete(logObject).then(function deleteSuccess() {
                    scope.$root.showSpinner = false;
                    // tell parent controller data updated
                    scope.$emit('record-deleted');

                }).catch(function (error) {
                    scope.$root.showSpinner = false;
                    ErrorService.handleException(error, true); // throw exception for dismissible pop- up (error, isDismissible = true)
                });
            }
        }

        return {
            restrict: 'AE',
            templateUrl:  UriUtils.chaiseDeploymentPath() + 'common/templates/ellipsis.html',
            scope: {
                tuple: '=',
                rowValues: '=', // tuple's values
                context: '=',
                config: '=',    // {viewable, editable, deletable, selectMode}
                onRowClickBind: '=?',
                // the tuple of the parent reference (not the reference that this ellipsis is based on)
                // in popups and related: the main page tuple, otherwise: it will be empty
                parentTuple: '=?',
                selected: '=',
                selectDisabled: "=?",
                displayMode: "@",
                parentReference: "=?",
                columnModels: "=",
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

                    var editLink = null;

                    // unlink button should only show up in related mode
                    if (scope.displayMode.indexOf(recordsetDisplayModes.related) === 0 && scope.parentTuple) {
                        scope.associationRef = scope.tuple.getAssociationRef(scope.parentTuple.data);
                    }

                    if (scope.config.viewable)
                        scope.viewLink = scope.tuple.reference.contextualize.detailed.appLink;

                    if (scope.config.editable && scope.associationRef)
                        editLink = scope.associationRef.contextualize.entryEdit.appLink;

                    else if (scope.config.editable)
                        editLink = scope.tuple.reference.contextualize.entryEdit.appLink;


                    if (editLink) {
                        scope.edit = function () {
                            var id = MathUtils.getRandomInt(0, Number.MAX_SAFE_INTEGER);
                            var link = editLink + '?invalidate=' + UriUtils.fixedEncodeURIComponent(id);
                            $window.open(link, '_blank');
                            scope.$emit("edit-request", {"id": id, "schema": scope.tuple.reference.location.schemaName, "table": scope.tuple.reference.location.tableName});
                        };
                    }

                    // TODO: why do we need to verify the context?
                    // NOTE: unlink only makes sense in the context of record app because there is a parent tuple
                    // there is no concept of an association in other apps (no parent)
                    scope.isUnLink = (scope.config.deletable && scope.context.indexOf("compact/brief") === 0 && scope.associationRef);

                    if (scope.isUnLink) {
                        var associatedRefTuples = [];
                        // define unlink function
                        scope.unlink = function() {
                            deleteReference(scope, scope.associationRef);
                        };
                    } else if (scope.config.deletable) {
                        // define delete function
                        scope.delete = function() {
                            deleteReference(scope, scope.tuple.reference);
                        };
                    }
                };

                // Initialize the action column btn links
                init();

                scope.onSelect = function($event) {
                    var args = {"tuple": scope.tuple};
                    if (scope.onRowClickBind) {
                        scope.onRowClickBind(args, $event);
                    } else if (scope.onRowClick) {
                        scope.onRowClick(args, $event);
                    }
                };

                // If chaiseconfig contains maxRecordSetHeight then apply more-less styling
                if (chaiseConfig.maxRecordsetRowHeight != false ) {
                    var userClicked = false,
                        moreButtonHeight = 20,
                        maxHeight = chaiseConfig.maxRecordsetRowHeight || 160,
                        maxHeightStyle = { "max-height": (maxHeight - moreButtonHeight) + "px" };

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

                            // +10 to account for padding on TD
                            scope.overflow[i] = (currentTD.children[0].clientHeight + 10) > maxHeight
                        }
                    }

                    var initializeOverflowLogic = function () {
                        setOverflows();

                        scope.hideContent = true;
                        scope.maxHeightStyle = maxHeightStyle;

                        scope.$digest();
                    }

                    new ResizeSensor(element[0], function (dimensions) {
                        // if TR.offsetHeight > the calculated maxRecordsetRowHeight
                        // +10 to account for padding on TD element
                        if (dimensions.height > (maxHeight + 10)) {
                            // iterate over each cell (TD), check it's height, and set overflow if necessary
                            if (!userClicked) {
                                initializeOverflowLogic();
                            }
                        } else if (dimensions.height < (maxHeight + 10)) {
                            scope.overflow = [];
                        }
                    });

                    // reset overflows because new rows are available
                    $rootScope.$on('reference-modified', function() {
                        scope.overflow = [];
                        scope.hideContent = false;
                        scope.maxHeightStyle = null;
                        userClicked = false;

                        $timeout(function () {
                            initializeOverflowLogic();
                        });
                    });
                }

            }
        };
    }])


})();
