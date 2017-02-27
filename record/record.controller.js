(function() {
    'use strict';

    angular.module('chaise.record')

    .controller('RecordController', ['AlertsService', '$cookies', '$log', 'UriUtils', 'DataUtils', 'MathUtils', '$rootScope', '$window', '$scope', function RecordController(AlertsService, $cookies, $log, UriUtils, DataUtils, MathUtils, $rootScope, $window, $scope) {
        var vm = this;
        var addRecordRequests = {}; // <generated unique id : reference of related table>
        var editRecordRequests = {}; // generated id: {schemaName, tableName}
        var updated = {};

        vm.alerts = AlertsService.alerts;
        vm.showEmptyRelatedTables = false;
        vm.makeSafeIdAttr = DataUtils.makeSafeIdAttr;

        vm.canCreate = function() {
            return ($rootScope.reference && $rootScope.reference.canCreate && $rootScope.modifyRecord);
        };

        vm.createRecord = function() {
            var newRef = $rootScope.reference.table.reference.contextualize.entryCreate;
            var appURL = newRef.appLink;
            if (!appURL) {
                AlertsService.addAlert({type: 'error', message: "Application Error: app linking undefined for " + newRef.compactPath});
            }
            else {
                $window.location.href = appURL;
            }
        };

        vm.canEdit = function() {
            var canEdit = ($rootScope.reference && $rootScope.reference.canUpdate && $rootScope.modifyRecord);
            // If user can edit this record (canEdit === true), then change showEmptyRelatedTables.
            // Otherwise, canEdit will be undefined, so no need to change anything b/c showEmptyRelatedTables is already false.
            if (canEdit === true) {
                vm.showEmptyRelatedTables = true;
            }
            return canEdit;
        };

        vm.editRecord = function() {
            var newRef = $rootScope.reference.contextualize.entryEdit;
            var appURL = newRef.appLink;
            if (!appURL) {
                AlertsService.addAlert({type: 'error', message: "Application Error: app linking undefined for " + newRef.compactPath});
            }
            else {
                $window.location.href = appURL;
            }
        };

        vm.copyRecord = function() {
            var newRef = $rootScope.reference.contextualize.entryCreate;

            var appLink = newRef.appLink + "?copy=true&limit=1";
            $window.location.href = appLink;
        };

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
                    ErrorService.catchAll(error);
                    $log.warn(error);
                }
            });
        };

        vm.permalink = function getPermalink() {
            if (!$rootScope.reference) {
                return $window.location.href;
            }
            return $rootScope.context.mainURI;
        };

        vm.toRecordSet = function(ref) {
            var appURL = ref.appLink;
            if (!appURL) {
                return AlertsService.addAlert({type: 'error', message: "Application Error: app linking undefined for " + ref.compactPath});
            }
            return $window.location.href = appURL;
        };

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

        vm.toggleRelatedTableDisplayType = function(i) {
            if ($rootScope.tableModels[i].displayType == 'markdown') {
                $rootScope.tableModels[i].displayType = 'table';
            } else {
                $rootScope.tableModels[i].displayType = 'markdown';
            }
        };

        vm.toggleRelatedTables = function() {
            vm.showEmptyRelatedTables = !vm.showEmptyRelatedTables;
        };

        vm.canCreateRelated = function(relatedRef) {
            return (relatedRef.canCreate && $rootScope.modifyRecord);
        };

        // Send user to RecordEdit to create a new row in this related table
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
                        })(i);
                    }
                }
            }

        };

        window.updated = function(id) {
            updated[editRecordRequests[id].schema + ":" + editRecordRequests[id].table] = true;
            delete editRecordRequests[id];
        }
    }]);
})();
