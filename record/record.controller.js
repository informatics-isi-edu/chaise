(function() {
    'use strict';

    angular.module('chaise.record')

    .controller('RecordController', ['AlertsService', '$cookies', '$log', 'UriUtils', '$rootScope', '$window', function RecordController(AlertsService, $cookies, $log, UriUtils, $rootScope, $window) {
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
                        if ($rootScope.lastRendered == $rootScope.relatedReferences.length-1) {
                            $rootScope.loading = false;
                        }
                    }
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

        // Send user to RecordEdit to create a new row in this related table
        vm.addRelatedRecord = function(ref) {
            // 1. Pluck required values from the ref into cookie obj by getting the values of the keys that form this FK relationship
            var cookie = {
                rowname: $rootScope.recordDisplayname,
                constraintName: ref.origFKR.constraint_names[0].join(':')
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
            console.log('Cookie', cookie);
            // 2. Generate a unique for a coookie, set to expire after 24hrs, set it on browser.
            var COOKIE_NAME = 'recordedit-' + getRandomInt(0, Number.MAX_SAFE_INTEGER);
            $cookies.putObject(COOKIE_NAME, cookie, {
                expires: new Date(Date.now() + (60 * 60 * 24 * 1000))
            });
            // 3. Get appLink, append ?prefill=[COOKIE_NAME]
            var appLink = newRef.appLink + '?prefill=' + UriUtils.fixedEncodeURIComponent(COOKIE_NAME);
            console.log(appLink);
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

        // TODO: Refactor this out to common/
        function getRandomInt(min, max) {
          min = Math.ceil(min);
          max = Math.floor(max);
          return Math.floor(Math.random() * (max - min)) + min;
        }
    }]);
})();
