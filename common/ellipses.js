(function () {
    'use strict';

    angular.module('chaise.ellipses', [])

    .filter('trustedHTML', ['$sce', function($sce){
        return function(text) {
            return $sce.trustAsHtml(text);
        };
    }])

    .directive('ellipses', ['AlertsService', 'ErrorService', 'logActions', 'MathUtils', 'messageMap', 'modalBox', 'modalUtils', 'UiUtils', 'UriUtils', '$log', '$rootScope', '$sce', '$timeout', '$window', 'defaultDisplayname',
        function(AlertsService, ErrorService, logActions, MathUtils, messageMap, modalBox, modalUtils, UiUtils, UriUtils, $log, $rootScope, $sce, $timeout, $window, defaultDisplayname) {

        function deleteReference(scope, reference) {
            var logObject = {action: logActions.recordsetDelete};
            // if parentReference exists then it's in the related entities section
            if (scope.parentReference) {
                logObject = {
                    action: logActions.recordRelatedDelete,
                    referrer: scope.parentReference.defaultLogInfo
                };
            }

            if (chaiseConfig.confirmDelete === undefined || chaiseConfig.confirmDelete) {
                var onError = function (response) {
                    scope.$root.showSpinner = false;
                    // if response is string, the modal has been dismissed
                    if (typeof response !== "string") {
                        ErrorService.handleException(response, true);  // throw exception for dismissible pop- up (error, isDismissible = true)
                    }
                }
                modalUtils.showModal({
                    templateUrl: "../common/templates/delete-link/confirm_delete.modal.html",
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
            templateUrl: '../common/templates/ellipses.html',
            scope: {
                tuple: '=',
                rowValues: '=', // tuple's values
                context: '=',
                config: '=',    // {viewable, editable, deletable, selectMode}
                onRowClickBind: '=?',
                fromTuple: '=?',
                selected: '=',
                selectDisabled: "=?",
                parentReference: "=?"
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

                    if (scope.fromTuple) {
                        scope.associationRef = scope.tuple.getAssociationRef(scope.fromTuple.data);
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

                    // define unlink function
                    // TODO why do we need to verify the context?
                    if (scope.config.deletable && scope.context.indexOf("compact/brief") === 0 && scope.associationRef) {
                        var associatedRefTuples = [];
                        scope.unlink = function() {
                            deleteReference(scope, scope.associationRef);
                        };
                    }

                    // define delete function
                    else if (scope.config.deletable) {
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

                for (var i = 0; i < element[0].children.length; i++) {
                    scope.overflow[i] = false;
                }

                // If chaiseconfig contains maxRecordSetHeight then only apply more-less styling
                if (chaiseConfig.maxRecordsetRowHeight != false ) {

                    // 1em = 14px
                    // 7.25em = 101.5px
                    var moreButtonHeight = 20;
                    var maxHeight = chaiseConfig.maxRecordsetRowHeight || 160;
                    var maxHeightStyle = { "max-height": (maxHeight - moreButtonHeight) + "px" }

                    scope.readmore = function() {
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

                    var containsOverflow = false;

                    // This function checks for height of an element in the row at an index(td'th)
                    // and Set overflow
                    var updateHeight = function(index, element) {
                        var height = element.clientHeight;
                        if (height > maxHeight) {
                            scope.overflow[index] = true;
                            scope.hideContent = true;
                            containsOverflow = true;
                            scope.maxHeightStyle = maxHeightStyle;
                        } else {
                            scope.overflow[index] = false;
                        }
                    }

                    // Resizerow is called whenever there is a change in rowValues model
                    // It iterates over all the td elements and extracts image and iframes from it
                    // After which it binds onload event to adjust height
                    // It also calls updateHeight for the same td, for any oveflown textual content
                    var resizeRow = function() {
                        if (containsOverflow == false) {

                            //Iterate over table data in the row
                            for (var i = 0; i < element[0].children.length; i++) {

                                // Get all images and iframes inside the td
                                var imagesAndIframes = UiUtils.getImageAndIframes(element[0].children[i]);

                                // Bind onload event and updateheight for particular td index
                                imagesAndIframes.forEach(function(el) {
                                    var index = i;
                                    el.onload = function() {
                                        updateHeight(index, el);
                                    };
                                });

                                updateHeight(i, element[0].children[i].children[0]);
                            }
                        }
                    };

                }


                // Watch for change in rowValues, this is useful in case of pagination
                // As Angular just changes the content and doesnot destroys elements
                scope.$watchCollection('rowValues', function (v) {
                    init();

                    // add timeout only if maxRecordsetRowHeight is not false in chaiseConfig
                    if (chaiseConfig.maxRecordsetRowHeight != false ) {
                        $timeout(function() {
                            containsOverflow = false;
                            resizeRow();
                        }, 0);
                    }
                });
            }
        };
    }])


})();
