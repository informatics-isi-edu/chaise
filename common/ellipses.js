(function () {
    'use strict';

    angular.module('chaise.ellipses', [])


        .directive('ellipses', ['$sce', '$timeout', 'AlertsService', 'ErrorService', '$uibModal', '$log', 'MathUtils', 'messageMap', 'UriUtils', '$window', 'UiUtils',
            function($sce, $timeout, AlertsService, ErrorService, $uibModal, $log, MathUtils, messageMap, UriUtils, $window, UiUtils) {

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

                    var init = function() {

                        scope.overflow = []; // for each cell in the row
                        scope.hideContent = false;
                        scope.linkText = "more";
                        scope.maxHeightStyle = { };


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
                                        }, function errorOpening1stModal(error) {
                                            console.dir('ERROR opening 1st modal', error);
                                        }).then(function deleteSuccess() {

                                            // tell parent controller data updated
                                            scope.$emit('record-modified');

                                        }, function deleteFailure(response) {
                                            console.dir('RESPONSE', response);
                                            // if (response != "cancel") {
                                                if (response instanceof ERMrest.PreconditionFailedError) {
                                                    // If a 412 is encountered, it means this row's info doesn't match
                                                    // with the info in the DB currently.

                                                    // 1. Open modal to let user know.
                                                    $uibModal.open({
                                                        templateUrl: "../common/templates/uiChange.modal.html",
                                                        controller: "ErrorDialogController",
                                                        controllerAs: "ctrl",
                                                        size: "sm",
                                                        resolve: {
                                                            params: {
                                                                title: messageMap.reviewModifiedRecord.title,
                                                                message: messageMap.reviewModifiedRecord.message
                                                            }
                                                        },
                                                        backdrop: 'static',
                                                        keyboard: false
                                                    }).result.then(function reload() {
                                                    // 2. Update UI by letting the table directive know
                                                        scope.$emit('record-modified');
                                                    }).catch(function(error) {
                                                        console.dir('ERROR opening 2nd modal', error);
                                                        ErrorService.catchAll(error);
                                                    });
                                                } else {
                                                    scope.$emit('error', response);
                                                    ErrorService.catchAll(error);
                                                }
                                            // }
                                        }).catch(function (error) {
                                            $log.info(error);
                                            scope.$emit('error', response);
                                        });
                                    } else {

                                        scope.associationRef.delete(associatedRefTuples).then(function deleteSuccess() {

                                            // tell parent controller data updated
                                            scope.$emit('record-modified');

                                        }, function deleteFailure(response) {
                                            console.dir('RESPONSE', response);
                                            if (response instanceof ERMrest.PreconditionFailedError) {
                                                // If a 412 is encountered, it means this row's info doesn't match
                                                // with the info in the DB currently.

                                                // 1. Open modal to let user know.
                                                $uibModal.open({
                                                    templateUrl: "../common/templates/uiChange.modal.html",
                                                    controller: "ErrorDialogController",
                                                    controllerAs: "ctrl",
                                                    size: "sm",
                                                    resolve: {
                                                        params: {
                                                            title: messageMap.reviewModifiedRecord.title,
                                                            message: messageMap.reviewModifiedRecord.message
                                                        }
                                                    },
                                                    backdrop: 'static',
                                                    keyboard: false
                                                }).result.then(function reload() {
                                                // 2. Update UI by letting the table directive know
                                                    scope.$emit('record-modified');
                                                }).catch(function(error) {
                                                    console.log('ERROR opening 2nd modal', error);
                                                    ErrorService.catchAll(error);
                                                });
                                            } else {
                                                scope.$emit('error', response);
                                                ErrorService.catchAll(error);
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
                                console.log('Beginning delete..');
                                var tuples = [scope.tuple];
                                if (chaiseConfig.confirmDelete === undefined || chaiseConfig.confirmDelete) {
                                    $uibModal.open({
                                        templateUrl: "../common/templates/delete-link/confirm_delete.modal.html",
                                        controller: "ConfirmDeleteController",
                                        controllerAs: "ctrl",
                                        size: "sm"
                                    }).result.then(function success() {
                                        // user accepted prompt to delete
                                        console.log('Successfully deleted on first try');
                                        return scope.tuple.reference.delete(tuples);

                                    }, function errorOpening1stModal(error) {
                                        console.dir('Error opening confirm delete modal', error);
                                        $window.alert(error);
                                    }).then(function deleteSuccess() {
                                        console.log('deleted on first try, sending record-modified msg');
                                        // tell parent controller data updated
                                        scope.$emit('record-modified');

                                    }, function deleteFailure(response) {
                                        if (response != "cancel") {
                                            if (response instanceof ERMrest.PreconditionFailedError) {
                                                console.log('delete failed and it was a 412');
                                                // If a 412 is encountered, it means this row's info doesn't match
                                                // with the info in the DB currently.

                                                // 1. Open modal to let user know.
                                                $uibModal.open({
                                                    templateUrl: "../common/templates/uiChange.modal.html",
                                                    controller: "ErrorDialogController",
                                                    controllerAs: "ctrl",
                                                    size: "sm",
                                                    resolve: {
                                                        params: {
                                                            title: messageMap.reviewModifiedRecord.title,
                                                            message: messageMap.reviewModifiedRecord.message
                                                        }
                                                    },
                                                    backdrop: 'static',
                                                    keyboard: false
                                                }).result.then(function() {
                                                // 2. Update UI by letting the table directive know
                                                    scope.$emit('record-modified');
                                                }, function errorOpening2ndModal(error) {
                                                    console.dir('error opening 2nd modal', error);
                                                    $window.alert(error);
                                                }).catch(function(error) {
                                                    $window.alert(error);
                                                    ErrorService.catchAll(error);
                                                });
                                            } else {
                                                console.log('delete failed but it was nOT a 412', response);
                                                scope.$emit('error', response);
                                                ErrorService.catchAll(error);
                                            }
                                        }
                                    }).catch(function (error) {
                                        console.log('there was some other uncaught error', error);
                                        $window.alert(error);
                                        ErrorService.catchAll(error);
                                        scope.$emit('error', response);
                                    });
                                } else {

                                    scope.tuple.reference.delete(tuples).then(function deleteSuccess() {

                                        // tell parent controller data updated
                                        scope.$emit('record-modified');

                                    }, function deleteFailure(response) {
                                        if (response instanceof ERMrest.PreconditionFailedError) {
                                            // If a 412 is encountered, it means this row's info doesn't match
                                            // with the info in the DB currently.

                                            // 1. Open modal to let user know.
                                            $uibModal.open({
                                                templateUrl: "../common/templates/uiChange.modal.html",
                                                controller: "ErrorDialogController",
                                                controllerAs: "ctrl",
                                                size: "sm",
                                                resolve: {
                                                    params: {
                                                        title: messageMap.reviewModifiedRecord.title,
                                                        message: messageMap.reviewModifiedRecord.message
                                                    }
                                                },
                                                backdrop: 'static',
                                                keyboard: false
                                            }).result.then(function reload() {
                                            // 2. Update UI by letting the table directive know
                                                scope.$emit('record-modified');
                                            }).catch(function(error) {
                                                ErrorService.catchAll(error);
                                            });
                                        } else {
                                            scope.$emit('error', response);
                                            ErrorService.catchAll(error);
                                        }
                                    }).catch(function (error) {
                                        scope.$emit('error', response);
                                        ErrorService.catchAll(error);
                                    });
                                }
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
                        var updateHeight = function(index ,element) {
                            var height = element.clientHeight;
                            if (height > maxHeight) {
                                scope.overflow[index] = true;
                                scope.hideContent = true;
                                containsOverflow = true;
                                scope.maxHeightStyle =  maxHeightStyle;
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
