(function () {
    'use strict';

    angular.module('chaise.ellipses', [])


        .directive('ellipses', ['$sce', '$timeout', 'AlertsService', '$uibModal', '$log', function($sce, $timeout, AlertsService, $uibModal, $log) {

            return {
                restrict: 'AE',
                templateUrl: '../common/templates/ellipses.html',
                scope: {
                    tuple: '=',
                    rowValues: '=', // tuple's values
                    context: "=",
                    config: '=',    // {viewable, editable, deletable, selectable}
                    onRowClickBind: '=?'
                },
                link: function (scope, element) {
                    scope.overflow = []; // for each cell in the row

                    scope.hideContent = false;
                    scope.linkText = "more";
                    scope.maxHeightStyle = { };
                    // TODO jchen make _context and _derivedAssociationRef available
                    scope.isAssociation = (scope.context === "compact/brief") && (scope.tuple.reference._derivedAssociationRef !== undefined);

                    if (scope.config.viewable)
                        scope.viewLink = scope.tuple.reference.contextualize.detailed.appLink;

                    if (scope.config.editable)
                        scope.editLink = scope.tuple.reference.contextualize.entryEdit.appLink;

                    if (scope.config.deletable) {
                        scope.delete = function() {

                            var deleteReference;

                            // if table is compact/brief and is based on binary association table
                            // delete the linking
                            // WATCH OUT! Using tuple's reference's context, which is current the same as its table's reference
                            // Just case this logic changes in ErmrestJs
                            // TODO jchen make _derivedAssociationRef available
                            // TODO _derivedAssociationRef is wrong!!!! It's a table, not a row
                            if (scope.context === "compact/brief" && scope.tuple.reference._derivedAssociationRef)
                                deleteReference = scope.tuple.reference._derivedAssociationRef;
                            else
                                deleteReference = scope.tuple.reference;

                            // else
                            if (chaiseConfig.confirmDelete === undefined || chaiseConfig.confirmDelete) {
                                $uibModal.open({
                                    templateUrl: "../common/templates/delete-link/confirm_delete.modal.html",
                                    controller: "ConfirmDeleteController",
                                    controllerAs: "ctrl",
                                    size: "sm"
                                }).result.then(function success() {
                                    // user accepted prompt to delete
                                    return deleteReference.delete();
                                }).then(function deleteSuccess() {

                                    // tell parent controller data updated
                                    scope.$emit('record-modified');

                                }, function deleteFailure(response) {
                                    if (response != "cancel") {
                                        scope.$emit('error', response);
                                        $log.warn(response);
                                    }
                                }).catch(function (error) {
                                    $log.info(error);
                                    scope.$emit('error', response);
                                });
                            } else {
                                deleteReference.delete().then(function deleteSuccess() {

                                    // tell parent controller data updated
                                    scope.$emit('record-modified');

                                }, function deleteFailure(response) {
                                    scope.$emit('error', response);
                                    $log.warn(response);
                                }).catch(function (error) {
                                    scope.$emit('error', response);
                                    $log.info(error);
                                });
                            }
                        };
                    }

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

                        var timerCount = 0, containsOverflow = false;

                        var resizeRow = function() {
                            if (containsOverflow == false && timerCount ++ < 500) {
                                
                                for (var i = 0; i < element[0].children.length; i++) {
                                    var height = element[0].children[i].children[0].clientHeight;
                                    if (height > maxHeight) {
                                        scope.overflow[i] = true;
                                        scope.hideContent = true;
                                        containsOverflow = true;
                                        scope.maxHeightStyle =  maxHeightStyle;
                                    } else {
                                        scope.overflow[i] = false;
                                    }
                                }
                                $timeout(function() {
                                    resizeRow();
                                }, 50);
                            }
                        };      

                        scope.$watchCollection('rowValues', function (v) {
                            $timeout(function() {
                                timerCount = 0;
                                containsOverflow = false;
                                resizeRow();
                            }, 10);
                           
                        });
                    }
                }
            };
        }])


})();