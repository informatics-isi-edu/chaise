(function () {
    'use strict';

    angular.module('chaise.ellipses', [])

    .filter('trustedHTML', ['$sce', function($sce){
        return function(text) {
            return $sce.trustAsHtml(text);
        };
    }])

    .directive('ellipses', ['$sce', '$timeout', 'AlertsService', 'ErrorService', '$uibModal', '$log', 'MathUtils', 'messageMap', 'UriUtils', '$window', 'UiUtils', 'modalBox', function($sce, $timeout, AlertsService, ErrorService, $uibModal, $log, MathUtils, messageMap, UriUtils, $window, UiUtils, modalBox) {

        function deleteTuples(scope, reference, tuples) {
            if (chaiseConfig.confirmDelete === undefined || chaiseConfig.confirmDelete) {
                $uibModal.open({
                    templateUrl: "../common/templates/delete-link/confirm_delete.modal.html",
                    controller: "ConfirmDeleteController",
                    controllerAs: "ctrl",
                    size: "sm"
                }).result.then(function success() {
                    // user accepted prompt to delete
                    return reference.delete(tuples);
                }).then(function deleteSuccess() {
                    // tell parent controller data updated
                    scope.$emit('record-deleted');

                }, function deleteFailure(response) {
                    if (typeof response !== "string") {
                        throw response;
                    }
                }).catch(function (error) {
                    throw error;
                });
            } else {

                reference.delete(tuples).then(function deleteSuccess() {

                    // tell parent controller data updated
                    scope.$emit('record-deleted');

                }, function deleteFailure(response) {
                    throw response;
                }).catch(function (error) {
                    throw error;
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
                selected: '='
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

                    var editLink = null;

                    if (scope.fromTuple)
                        scope.associationRef = scope.tuple.getAssociationRef(scope.fromTuple.data);

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
                        }
                    }

                    // define unlink function
                    if (scope.config.deletable && scope.context === "compact/brief" && scope.associationRef) {
                        var associatedRefTuples = [];
                        scope.associationRef.read(1).then(function(page) {
                            associatedRefTuples = page.tuples;
                            scope.unlink = function() {
                                deleteTuples(scope, scope.associationRef, associatedRefTuples)
                            };
                        }).catch(function(e) {
                            throw e;
                        });
                    }

                    // define delete function
                    else if (scope.config.deletable) {
                        scope.delete = function() {
                            deleteTuples(scope, scope.tuple.reference, [scope.tuple])
                        };
                    }
                };

                // Initialize the action column btn links
                init();

                scope.onSelect = function() {
                    var args = {"tuple": scope.tuple};
                    if (scope.onRowClickBind) {
                        scope.onRowClickBind(args);
                    } else if (scope.onRowClick) {
                        scope.onRowClick(args);
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
