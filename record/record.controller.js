(function() {
    'use strict';

    angular.module('chaise.record')

    .controller('RecordController', ['AlertsService', '$cookies', '$log', 'UriUtils', 'DataUtils', '$rootScope', '$window', function RecordController(AlertsService, $cookies, $log, UriUtils, DataUtils, $rootScope, $window) {
        var vm = this;

        vm.alerts = AlertsService.alerts;
        vm.modifyRecord = chaiseConfig.editRecord === false ? false : true;
        vm.showDeleteButton = chaiseConfig.showDeleteButton === true ? true : false;
        vm.showEmptyRelatedTables = false;

        vm.createRecord = function() {
            var newRef = $rootScope.reference.contextualize.entryCreate;
            var appURL = newRef.appLink;
            if (!appURL) {
                AlertsService.addAlert({type: 'error', message: "Application Error: app linking undefined for " + newRef.compactPath});
            }
            else {
                $window.location.href = appURL;
            }
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

        vm.deleteRecord = function() {
            $rootScope.reference.delete().then(function deleteSuccess() {
                 var location = $rootScope.reference.location;
                //success, go to databrowser or home
                $window.location.href = "../search/#" + location.catalog + '/' + location.schemaName + ':' + location.tableName;
            }, function deleteFail(error) {
                AlertsService.addAlert({type: 'error', message: error.message});
                $log.warn(error);
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


        vm.toggleRelatedTables = function() {
            vm.showEmptyRelatedTables = !vm.showEmptyRelatedTables;
        };

        // Send user to RecordEdit to create a new row in this related table
        vm.addRelatedRecord = function(ref) {
            // 1. Pluck required values from the ref into cookie obj by getting the values of the keys that form this FK relationship
            var cookie = {
                rowname: $rootScope.recordDisplayname,
                constraintName: ref.origFKR.constraint_names[0].join(':'),
                originUri: $rootScope.reference.uri,
                objectUri: ref.uri
            };
            var newRef = ref.contextualize.entryCreate;
            var mapping = newRef.origFKR.mapping;

            // Get the column pair that form this FKR between this related table and the main entity
            cookie.keys = {};
            mapping._from.forEach(function(fromColumn, i) {
                var toColumn = mapping._to[i];
                // Assign the column value into cookie
                cookie.keys[fromColumn.name] = $rootScope.tuple.data[toColumn.name];
            });
            // 2. Generate a unique cookie name and set it to expire after 24hrs.
            var COOKIE_NAME = 'recordedit-' + getRandomInt(0, Number.MAX_SAFE_INTEGER);
            $cookies.putObject(COOKIE_NAME, cookie, {
                expires: new Date(Date.now() + (60 * 60 * 24 * 1000))
            });
            // 3. Get appLink, append ?prefill=[COOKIE_NAME]
            var appLink = newRef.appLink + '?prefill=' + UriUtils.fixedEncodeURIComponent(COOKIE_NAME);
            // 4. Redirect to the url in a new tab
            var window = $window.open(appLink, '_blank');
            if (window) {
                // Browser allowed the window to be opened, switch to it.
                window.focus();
            } else {
                // Browser blocked the popup/new window/new tab. TODO: Just redirect in same window?
                $window.location.href = appLink;
            }
        };

        // When page gets focus, check cookie for any related table row additions
        // re-read the records for that table
        $window.onfocus = function() {
            // if cookie has addition { objectUri: count, ... }
            var cookie = $cookies.getObject($rootScope.reference.uri);
            if (cookie) {
                for (var objectUri in cookie) {
                    // find matching Reference
                    for (var i = 0; i < $rootScope.relatedReferences.length; i++) {
                        if ($rootScope.relatedReferences[i].uri === objectUri) {
                            // update table's row values
                            (function (i) {
                                $rootScope.relatedReferences[i].read($rootScope.tableModels[i].pageLimit).then(function (page) {
                                    $rootScope.tableModels[i].rowValues = DataUtils.getRowValuesFromPage(page);
                                });
                            })(i);
                        }
                    }
                }
                $cookies.remove($rootScope.reference.uri);
            }

        };

        // Refactor this out to common folder if other apps need it
        function getRandomInt(min, max) {
          min = Math.ceil(min);
          max = Math.floor(max);
          return Math.floor(Math.random() * (max - min)) + min;
        }

    }]);
})();
