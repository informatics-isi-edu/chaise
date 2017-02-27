(function () {
    'use strict';

    angular.module('chaise.ellipses', [])


        .directive('ellipses', ['$sce', '$timeout', 'AlertsService', 'ErrorService', '$uibModal', '$log', 'MathUtils', 'UriUtils', '$window',
            function($sce, $timeout, AlertsService, ErrorService, $uibModal, $log, MathUtils, UriUtils, $window) {

            return {
                restrict: 'AE',
                templateUrl: '../common/templates/ellipses.html',
                scope: {
                    tuple: '=',
                    rowValues: '=', // tuple's values
                    context: "=",
                    config: '=',    // {viewable, editable, deletable, selectable}
                    onRowClickBind: '=?',
                    fromTuple: "=?"
                },
                link: function (scope, element) {
                    scope.overflow = []; // for each cell in the row

                    scope.hideContent = false;
                    scope.linkText = "more";
                    scope.maxHeightStyle = { };

                    var init = function() {

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
                                scope.unlink = function () {
                                    if (chaiseConfig.confirmDelete === undefined || chaiseConfig.confirmDelete) {
                                        $uibModal.open({
                                            templateUrl: "../common/templates/delete-link/confirm_delete.modal.html",
                                            controller: "ConfirmDeleteController",
                                            controllerAs: "ctrl",
                                            size: "sm"
                                        }).result.then(function success() {
                                            // user accepted prompt to delete
                                            return scope.associationRef.delete(associatedRefTuples);
                                        }).then(function deleteSuccess() {

                                            // tell parent controller data updated
                                            scope.$emit('record-modified');

                                        }, function deleteFailure(response) {
                                            if (response != "cancel") {
                                                if (response instanceof ERMrest.PreconditionFailedError) {
                                                    var params = {
                                                        recordUrl: $rootScope.reference.contextualize.detailed.appLink
                                                    };
                                                    $uibModal.open({
                                                        templateUrl: "../common/templates/deleteLater.modal.html",
                                                        controller: "ErrorDialogController",
                                                        controllerAs: "ctrl",
                                                        size: "sm",
                                                        resolve: {
                                                            params: params
                                                        }
                                                    }).result.then(function reviewRecord() {
                                                        // User opted to review the record
                                                        $window.location.href = params.recordUrl;
                                                    }, function cancel() {
                                                        // User clicked cancel.
                                                        // Do nothing. Just inserting an empty callback here to avoid tripping
                                                        // the .catch clause below.
                                                    }).catch(function(error) {
                                                        ErrorService.catchAll(error);
                                                    });
                                                } else {
                                                    scope.$emit('error', response);
                                                    $log.warn(response);
                                                }
                                            }
                                        }).catch(function (error) {
                                            $log.info(error);
                                            scope.$emit('error', response);
                                        });
                                    } else {

                                        scope.associationRef.delete(associatedRefTuples).then(function deleteSuccess() {

                                            // tell parent controller data updated
                                            scope.$emit('record-modified');

                                        }, function deleteFailure(response) {
                                            if (response instanceof ERMrest.PreconditionFailedError) {
                                                var params = {
                                                    recordUrl: $rootScope.reference.contextualize.detailed.appLink
                                                };
                                                $uibModal.open({
                                                    templateUrl: "../common/templates/deleteLater.modal.html",
                                                    controller: "ErrorDialogController",
                                                    controllerAs: "ctrl",
                                                    size: "sm",
                                                    resolve: {
                                                        params: params
                                                    }
                                                }).result.then(function reviewRecord() {
                                                    // User opted to review the record
                                                    $window.location.href = params.recordUrl;
                                                }, function cancel() {
                                                    // User clicked cancel.
                                                    // Do nothing. Just inserting an empty callback here to avoid tripping
                                                    // the .catch clause below.
                                                }).catch(function(error) {
                                                    ErrorService.catchAll(error);
                                                });
                                            } else {
                                                scope.$emit('error', response);
                                                $log.warn(response);
                                                ErrorService.catchAll(response);
                                            }
                                        }).catch(function (error) {
                                            scope.$emit('error', error);
                                            $log.info(error);
                                            ErrorService.catchAll(error);
                                        });
                                    }
                                }
                            }).catch(function(e) {
                                ErrorService.catchAll(e);
                            });
                        }

                        // define delete function
                        else if (scope.config.deletable) {
                            scope.delete = function () {
                                var tuples = [scope.tuple];
                                if (chaiseConfig.confirmDelete === undefined || chaiseConfig.confirmDelete) {
                                    $uibModal.open({
                                        templateUrl: "../common/templates/delete-link/confirm_delete.modal.html",
                                        controller: "ConfirmDeleteController",
                                        controllerAs: "ctrl",
                                        size: "sm"
                                    }).result.then(function success() {
                                        // user accepted prompt to delete

                                        return scope.tuple.reference.delete(tuples);

                                    }).then(function deleteSuccess() {

                                        // tell parent controller data updated
                                        scope.$emit('record-modified');

                                    }, function deleteFailure(response) {
                                        if (response != "cancel") {
                                            if (response instanceof ERMrest.PreconditionFailedError) {
                                                var params = {
                                                    recordUrl: $rootScope.reference.contextualize.detailed.appLink
                                                };
                                                $uibModal.open({
                                                    templateUrl: "../common/templates/deleteLater.modal.html",
                                                    controller: "ErrorDialogController",
                                                    controllerAs: "ctrl",
                                                    size: "sm",
                                                    resolve: {
                                                        params: params
                                                    }
                                                }).result.then(function reviewRecord() {
                                                    // User opted to review the record
                                                    $window.location.href = params.recordUrl;
                                                }, function cancel() {
                                                    // User clicked cancel.
                                                    // Do nothing. Just inserting an empty callback here to avoid tripping
                                                    // the .catch clause below.
                                                }).catch(function(error) {
                                                    ErrorService.catchAll(error);
                                                });
                                            } else {
                                                scope.$emit('error', response);
                                                $log.warn(response);
                                            }
                                        }
                                    }).catch(function (error) {
                                        $log.info(error);
                                        scope.$emit('error', response);
                                    });
                                } else {

                                    scope.tuple.reference.delete(tuples).then(function deleteSuccess() {

                                        // tell parent controller data updated
                                        scope.$emit('record-modified');

                                    }, function deleteFailure(response) {
                                        if (response instanceof ERMrest.PreconditionFailedError) {
                                            var params = {
                                                recordUrl: $rootScope.reference.contextualize.detailed.appLink
                                            };
                                            $uibModal.open({
                                                templateUrl: "../common/templates/deleteLater.modal.html",
                                                controller: "ErrorDialogController",
                                                controllerAs: "ctrl",
                                                size: "sm",
                                                resolve: {
                                                    params: params
                                                }
                                            }).result.then(function reviewRecord() {
                                                // User opted to review the record
                                                $window.location.href = params.recordUrl;
                                            }, function cancel() {
                                                // User clicked cancel.
                                                // Do nothing. Just inserting an empty callback here to avoid tripping
                                                // the .catch clause below.
                                            }).catch(function(error) {
                                                ErrorService.catchAll(error);
                                            });
                                        } else {
                                            scope.$emit('error', response);
                                            $log.warn(response);
                                        }
                                    }).catch(function (error) {
                                        scope.$emit('error', response);
                                        $log.info(error);
                                    });
                                }
                            };
                        }
                    };

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
                            init();
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
