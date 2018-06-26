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

        function deleteReference(scope, reference, tuple, isUnlink) {
            var logObject = {action: logActions.recordsetDelete};
            // if parentReference exists then it's in the related entities section
            if (scope.parentReference) {
                logObject = {
                    action: logActions.recordRelatedDelete,
                    referrer: scope.parentReference.defaultLogInfo
                };
            }

            var onError = function (hasConfirm) {
                return function (response) {
                    scope.$root.showSpinner = false;
                    // if response is string, the modal has been dismissed
                    if (!hasConfirm || typeof response !== "string") {
                        ErrorService.handleException(response, true);  // throw exception for dismissible pop- up (error, isDismissible = true)
                    }
                }
            }

            var deleteTuple = function (hasConfirmation) {
                scope.$root.showSpinner = true;
                // user accepted prompt to delete
                reference.delete(tuples, logObject).then(function deleteSuccess() {
                    scope.$root.showSpinner = false;
                    // tell parent controller data updated
                    scope.$emit('record-deleted');
                }).catch(onError());
            }

            var dataForDelete = {};
            // if assocation, we have to grab the key information for the association table from
            //   - the tuple.data (leaf table) and
            //   - $rootScope.tuple.data (main table)
            if (isUnlink) {
                var fks = reference.table.foreignKeys.all();
                for (var j=0; j<fks.length; j++) {
                    var fk = fks[j];
                    // loop through set of fk columns, each column in FK is identifying information that should be used as part of the uri for delete
                    for (var k=0; k<fk.colset.columns.length; k++) {
                        var col = fk.colset.columns[k];
                        var mappedCol = fk.mapping.get(col);

                        // if the mapping points to the leaf table, use the data from tuple
                        // else the mapping points to the main table, use the data from $rootScope.tuple
                        dataForDelete[col.name] = (mappedCol.table.name == tuple.reference.table.name) ? tuple.data[mappedCol.name] : $rootScope.tuple.data[mappedCol.name];
                    }
                }
            } else {
                for (var i=0; i<reference.table.shortestKey.length; i++) {
                    var keyname = reference.table.shortestKey[i].name;
                    dataForDelete[keyname] = tuple.data[keyname];
                }
            }


            var tuples = [dataForDelete];

            if (chaiseConfig.confirmDelete === undefined || chaiseConfig.confirmDelete) {
                modalUtils.showModal({
                    templateUrl: "../common/templates/delete-link/confirm_delete.modal.html",
                    controller: "ConfirmDeleteController",
                    controllerAs: "ctrl",
                    size: "sm"
                }, function onSuccess(res) {
                    deleteTuple(true)
                }, onError(true), false);
            } else {
                deleteTuple(false);
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
                            // For deleting association rows (M <= A => FK where A is the association table), set flag to true
                            deleteReference(scope, scope.associationRef, scope.tuple, true);
                        };
                    }

                    // define delete function
                    else if (scope.config.deletable) {
                        scope.delete = function() {
                            // For deleting a row, pass the tuple with it's appropriate key information
                            deleteReference(scope, scope.tuple.reference, scope.tuple, false);
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
