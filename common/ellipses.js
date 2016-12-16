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
                    config: '=',    // {viewable, editable, deletable, selectable}
                    onRowClickBind: '=?'
                },
                link: function (scope, element) {
                    scope.overflow = []; // for each cell in the row

                    scope.hideContent = false;
                    scope.linkText = "more";
                    scope.maxHeightStyle = { };
                    // TODO jchen make _context and _derivedAssociationRef available
                    scope.isAssociation = (scope.tuple.reference._context === "compact/brief") && (scope.tuple.reference._derivedAssociationRef !== undefined);

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
                            // TODO jchen make _context and _derivedAssociationRef available
                            if (scope.tuple.reference._context === "compact/brief" && scope.tuple.reference._derivedAssociationRef)
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

                                    // TODO jchen reload table?? send message to parent??

                                }, function deleteFailure(response) {
                                    if (response != "cancel") {
                                        AlertsService.addAlert({type: 'error', message: response.message});
                                        $log.warn(response);
                                    }
                                }).catch(function (error) {
                                    $log.info(error);
                                });
                            } else {
                                deleteReference.delete().then(function deleteSuccess() {

                                    // TODO jchen reload table?? send message to parent?? (recordset directive, or record app)

                                }, function deleteFailure(response) {
                                    AlertsService.addAlert({type: 'error', message: response.message});
                                    $log.warn(response);
                                }).catch(function (error) {
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

                    // 1em = 14px
                    // 7.25em = 101.5px
                    var maxHeight = chaiseConfig.maxRecordsetRowHeight || 160;
                    
                    scope.readmore = function() {
                        if (scope.hideContent) {
                            scope.hideContent = false;
                            scope.linkText = "less";
                            scope.maxHeightStyle =  { };
                        } else {
                            scope.hideContent = true;
                            scope.linkText = "more";
                            scope.maxHeightStyle =  { "max-height": maxHeight + "px" };
                        }
                    };

                    var timerCount = 0, containsOverflow = false, oldHeights = [];

                    function resizeRow() {
                        if (containsOverflow == false && timerCount ++ < 500) {
                            
                            for (var i = 0; i < element[0].children.length; i++) {
                                var height = element[0].children[i].children[0].clientHeight;
                                if (height < oldHeights[i]) continue;
                                if (height > maxHeight) {
                                    scope.overflow[i] = true;
                                    scope.hideContent = true;
                                    containsOverflow = true;
                                    scope.maxHeightStyle =  { "max-height": maxHeight + "px" };
                                } else {
                                    scope.overflow[i] = false;
                                }
                            }
                            $timeout(function() {
                                resizeRow();
                            }, 50);
                        }
                    }

                    resizeRow();

                }
            };
        }])


})();