(function() {
    'use strict';

    angular.module('chaise.record')

    .controller('RecordController', ['AlertsService', '$cookies', '$log', 'UriUtils', 'DataUtils', 'MathUtils', 'messageMap', '$rootScope', '$window', '$scope', '$uibModal', function RecordController(AlertsService, $cookies, $log, UriUtils, DataUtils, MathUtils, messageMap, $rootScope, $window, $scope, $uibModal) {
        var vm = this;
        var addRecordRequests = {}; // <generated unique id : reference of related table>
        var editRecordRequests = {}; // generated id: {schemaName, tableName}
        var updated = {};

        vm.alerts = AlertsService.alerts;
        vm.showEmptyRelatedTables = false;
        // TODO: Wrap in catcher fn
        vm.makeSafeIdAttr = DataUtils.makeSafeIdAttr;

        // TODO: Wrap in catcher fn. i.e. ...
        // vm.canCreate = catcher(function() {
        //     return ($rootScope.reference && $rootScope.reference.canCreate && $rootScope.modifyRecord);
        // });
        vm.canCreate = function() {
            return ($rootScope.reference && $rootScope.reference.canCreate && $rootScope.modifyRecord);
        };

        // TODO: Wrap in catcher fn.
        vm.createRecord = function() {
            var newRef = $rootScope.reference.table.reference.contextualize.entryCreate;
            var appURL = newRef.appLink;
            if (!appURL) {
                AlertsService.addAlert({type: 'error', message: "Application Error: app linking undefined for " + newRef.compactPath});
            }
            else {
                $window.location.href = appURL;
            }
            //     if (!appURL) {
            //          TODO: Should we throw an error if appURL doesn't exist?
            //                If yes, is this error too specific for the generic catchAll? i.e.:
            //
            //          throw new Error('SomeNewApplicationErrorClass');
            //
            //                If no, then it'd be nice to show something less scary/more
            //                more helpful to the user.
            //
            //     } else {
            //         $window.location.href = appURL;
            //     }
        };

        // TODO: Wrap in catcher fn.
        vm.canEdit = function() {
            var canEdit = ($rootScope.reference && $rootScope.reference.canUpdate && $rootScope.modifyRecord);
            // If user can edit this record (canEdit === true), then change showEmptyRelatedTables.
            // Otherwise, canEdit will be undefined, so no need to change anything b/c showEmptyRelatedTables is already false.
            if (canEdit === true) {
                vm.showEmptyRelatedTables = true;
            }
            return canEdit;
        };

        // TODO: Wrap in catcher fn.
        vm.editRecord = function() {
            var newRef = $rootScope.reference.contextualize.entryEdit;
            var appURL = newRef.appLink;
            if (!appURL) {
                // TODO: See above comment in vm.createRecord.
                AlertsService.addAlert({type: 'error', message: "Application Error: app linking undefined for " + newRef.compactPath});
            }
            else {
                $window.location.href = appURL;
            }
        };

        // TODO: Wrap in catcher fn.
        vm.copyRecord = function() {
            var newRef = $rootScope.reference.contextualize.entryCreate;
            // TODO: Add check for !appURL for consistency w/ vm.createRecord and vm.editRecord?
            // If yes, see comment in vm.createRecord for handling if appURL is falsy.
            var appLink = newRef.appLink + "?copy=true&limit=1";
            $window.location.href = appLink;
        };

        // TODO: Wrap in catcher fn.
        vm.canDelete = function() {
            return ($rootScope.reference && $rootScope.reference.canDelete && $rootScope.modifyRecord && $rootScope.showDeleteButton);
        };

        vm.deleteRecord = function() {
            $rootScope.reference.delete([$rootScope.tuple]).then(function deleteSuccess() {
                // Get an appLink from a reference to the table that the existing reference came from
                var unfilteredRefAppLink = $rootScope.reference.table.reference.contextualize.compact.appLink;
                $window.location.href = unfilteredRefAppLink;
            }, function deleteFail(error) {
                if (error instanceof ERMrest.PreconditionFailedError) {
                    $uibModal.open({
                        templateUrl: "../common/templates/refresh.modal.html",
                        controller: "ErrorDialogController",
                        controllerAs: "ctrl",
                        size: "sm",
                        resolve: {
                            params: {
                                title: messageMap.pageRefreshRequired.title,
                                message: messageMap.pageRefreshRequired.message
                            }
                        }
                    }).result.then(function reload() {
                        // Reload the page
                        $window.location.reload();
                    }).catch(function(error) {
                        // TODO: throw error here instead of passing to catchAll
                        ErrorService.catchAll(error);
                    });
                } else {
                    // TODO: throw error here instead of passing to catchAll
                    ErrorService.catchAll(error);
                    // TODO: $log.warn unncessary. There's a $log.info at
                    // the top of catchAll.
                    $log.warn(error);
                }
            });
            // TODO: Attach .catch to promise chain
            //      ErrorService.catchAll(e);
            // });
        };

        // TODO: Wrap in catcher fn.
        vm.permalink = function getPermalink() {
            if (!$rootScope.reference) {
                return $window.location.href;
            }
            return $rootScope.context.mainURI;
        };

        // TODO: Wrap in catcher fn.
        vm.toRecordSet = function(ref) {
            var appURL = ref.appLink;
            if (!appURL) {
                // TODO: See comment in vm.createRecord
                return AlertsService.addAlert({type: 'error', message: "Application Error: app linking undefined for " + ref.compactPath});
            }
            return $window.location.href = appURL;
        };

        // TODO: Wrap in catcher fn.
        vm.showRelatedTable = function(i) {
            var isFirst = false, prevTableHasLoaded = false;
            if ($rootScope.tableModels && $rootScope.tableModels[i]) {
                if (i === 0) {
                    $rootScope.lastRendered = 0;
                    isFirst = true;
                } else if ($rootScope.tableModels[i-1]) {
                    prevTableHasLoaded = $rootScope.tableModels[i-1].hasLoaded;
                    if ($rootScope.lastRendered == (i-1)) {
                        $rootScope.lastRendered = i;
                    }
                }

                if ($rootScope.lastRendered == $rootScope.relatedReferences.length-1) {
                    $rootScope.loading = false;
                }

                if (vm.showEmptyRelatedTables) {
                    return isFirst || prevTableHasLoaded;
                }

                if ((isFirst || prevTableHasLoaded) && $rootScope.tableModels[i].rowValues && $rootScope.tableModels[i].rowValues.length > 0) {
                    return (i == $rootScope.lastRendered);
                }

                return false;
            }
        };

        // TODO: Wrap in catcher fn.
        vm.toggleRelatedTableDisplayType = function(i) {
            if ($rootScope.tableModels[i].displayType == 'markdown') {
                $rootScope.tableModels[i].displayType = 'table';
            } else {
                $rootScope.tableModels[i].displayType = 'markdown';
            }
        };

        // TODO: Wrap in catcher fn.
        vm.toggleRelatedTables = function() {
            vm.showEmptyRelatedTables = !vm.showEmptyRelatedTables;
        };

        // TODO: Wrap in catcher fn.
        vm.canCreateRelated = function(relatedRef) {
            return (relatedRef.canCreate && $rootScope.modifyRecord);
        };

        // Send user to RecordEdit to create a new row in this related table
        // TODO: Wrap in catcher fn.
        vm.addRelatedRecord = function(ref) {
            // 1. Pluck required values from the ref into cookie obj by getting the values of the keys that form this FK relationship
            var cookie = {
                rowname: $rootScope.recordDisplayname,
                constraintName: ref.origColumnName
            };
            var mapping = ref.contextualize.entryCreate.origFKR.mapping;

            // Get the column pair that form this FKR between this related table and the main entity
            cookie.keys = {};
            mapping._from.forEach(function(fromColumn, i) {
                var toColumn = mapping._to[i];
                // Assign the column value into cookie
                cookie.keys[fromColumn.name] = $rootScope.tuple.data[toColumn.name];
            });
            // 2. Generate a unique cookie name and set it to expire after 24hrs.
            var COOKIE_NAME = 'recordedit-' + MathUtils.getRandomInt(0, Number.MAX_SAFE_INTEGER);
            $cookies.putObject(COOKIE_NAME, cookie, {
                expires: new Date(Date.now() + (60 * 60 * 24 * 1000))
            });

            // Generate a unique id for this request
            // append it to the URL
            var referrer_id = 'recordedit-' + MathUtils.getRandomInt(0, Number.MAX_SAFE_INTEGER);
            addRecordRequests[referrer_id] = ref.uri;

            // 3. Get appLink, append ?prefill=[COOKIE_NAME]&referrer=[referrer_id]
            var appLink = (ref.derivedAssociationReference ? ref.derivedAssociationReference.contextualize.entryCreate.appLink : ref.contextualize.entryCreate.appLink);
            appLink = appLink + (appLink.indexOf("?") === -1? "?" : "&") +
                'prefill=' + UriUtils.fixedEncodeURIComponent(COOKIE_NAME) +
                '&invalidate=' + UriUtils.fixedEncodeURIComponent(referrer_id);

            // 4. Redirect to the url in a new tab
            $window.open(appLink, '_blank');
        };

        $scope.$on("edit-request", function(event, args) {
            editRecordRequests[args.id] = {"schema": args.schema, "table": args.table};
        });

        // When page gets focus, check cookie for completed requests
        // re-read the records for that table
        // TODO: Wrap in catcher fn.
        $window.onfocus = function() {

            var completed = {};
            for (var id in addRecordRequests) {
                var cookie = $cookies.getObject(id);
                if (cookie) { // add request has been completed
                    completed[addRecordRequests[id]] = true;

                    // remove cookie and request
                    $cookies.remove(id);
                    delete addRecordRequests[id];
                }
            }

            // read updated tables
            if (Object.keys(completed).length > 0 || updated !== {}) {
                for (var i = 0; i < $rootScope.relatedReferences.length; i++) {
                    var relatedTableReference = $rootScope.relatedReferences[i];
                    if (completed[relatedTableReference.uri] || updated[relatedTableReference.location.schemaName + ":" + relatedTableReference.location.tableName]) {
                        delete updated[relatedTableReference.location.schemaName + ":" + relatedTableReference.location.tableName];
                        (function (i) {
                            relatedTableReference.read($rootScope.tableModels[i].pageLimit).then(function (page) {
                                $rootScope.tableModels[i].page = page;
                                $rootScope.tableModels[i].rowValues = DataUtils.getRowValuesFromPage(page);
                            });
                            // TODO: Attach a .catch
                            // .catch(e) {
                            //  ErrorService.catchAll(e);
                            // });
                        }
                        })(i);
                    }
                }
            }

        };

        // TODO: Wrap in catcher fn.
        window.updated = function(id) {
            updated[editRecordRequests[id].schema + ":" + editRecordRequests[id].table] = true;
            delete editRecordRequests[id];
        }
    }]);
})();
