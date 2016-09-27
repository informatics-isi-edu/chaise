
/*
 * Copyright 2016 University of Southern California
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function() {

    // The Chaise RecordSet module
    angular.module('recordset', [
        'ermrestjs',
        'chaise.navbar',
        'chaise.utils',
        'chaise.filters',
        'chaise.authen',
        'chaise.errors',
        'chaise.modal',
        'chaise.html',
        'chaise.record.table',
        'ui.bootstrap',
        'ngSanitize'])

    // Register the 'context' object which can be accessed by config and other
    // services.
    .constant('context', {
        appName:'recordset',
        mainURI: null,  // the main URL portion up to filters (without modifiers)
        catalogID: null,
        schemaName: null,
        tableName: null
    })



    // Register the 'recordsetModel' object, which can be accessed by other
    // services, but cannot be access by providers (and config, apparently).
    .value('recordsetModel', {
        tableDisplayName: null,
        columns: [],
        sortby: null,     // column name, user selected or null
        sortOrder: null,  // asc (default) or desc
        page: null,        // current page
        rowValues: []      // array of rows values, each value has this structure {isHTML:boolean, value:value}
    })

    .factory('pageInfo', [function() {
        return {
            loading: true,
            previousButtonDisabled: true,
            nextButtonDisabled: true,
            pageLimit: 25
        };

    }])

    // Register the recordset controller
    .controller('recordsetController', ['$scope', '$rootScope', 'context', 'pageInfo', '$window', 'recordsetModel', 'UriUtils', 'DataUtils', 'Session', '$log', 'ErrorService',
        function($scope, $rootScope, context, pageInfo, $window, recordsetModel, UriUtils, DataUtils, Session, $log, ErrorService) {

        $scope.vm = recordsetModel;

        $scope.pageInfo = pageInfo;

        $scope.pageLimits = [10, 25, 50, 75, 100, 200];

        $scope.pageLimit = function(limit) {
            pageInfo.pageLimit = limit;
            $scope.read();
        };

        $scope.navbarBrand = (chaiseConfig['navbarBrand'] !== undefined? chaiseConfig.navbarBrand : "");
        $scope.navbarBrandImage = (chaiseConfig['navbarBrandImage'] !== undefined? chaiseConfig.navbarBrandImage : "");
        $scope.navbarBrandText = (chaiseConfig['navbarBrandText'] !== undefined? chaiseConfig.navbarBrandText : "Chaise");

        $scope.login = function() {
            Session.login($window.location.href);
        };

        $scope.logout = function() {
            Session.logout();
        };

        $scope.sortby = function(column) {
            if (recordsetModel.sortby !== column) {
                recordsetModel.sortby = column;
                recordsetModel.sortOrder = "asc";
                $rootScope.reference = $rootScope.reference.sort([{"column":recordsetModel.sortby, "descending":(recordsetModel.sortOrder === "desc")}]);
                $scope.read();
            }

        };

        $scope.toggleSortOrder = function () {
            recordsetModel.sortOrder = (recordsetModel.sortOrder === 'asc' ? recordsetModel.sortOrder = 'desc' : recordsetModel.sortOrder = 'asc');
            $rootScope.reference = $rootScope.reference.sort([{"column":recordsetModel.sortby, "descending":(recordsetModel.sortOrder === "desc")}]);
            $scope.read();
        };

        $scope.read = function() {

            pageInfo.previousButtonDisabled = true;
            pageInfo.nextButtonDisabled = true;
            pageInfo.loading = true;

            $rootScope.reference.read(pageInfo.pageLimit).then(function (page) {
                $window.scrollTo(0, 0);

                recordsetModel.page = page;
                recordsetModel.rowValues = DataUtils.getRowValuesFromPage(page);

                pageInfo.loading = false;
                pageInfo.previousButtonDisabled = !page.hasPrevious;
                pageInfo.nextButtonDisabled = !page.hasNext;

                // update the address bar
                // page does not reload
                $window.location.replace($scope.permalink());
                $rootScope.location = $window.location.href;

            }, function error(response) {
                $log.warn(response);

                pageInfo.loading = false;
                pageInfo.previousButtonDisabled = true;
                pageInfo.nextButtonDisabled = true;

                throw response;
            }).catch(function genericCatch(exception) {
                if (exception instanceof ERMrest.UnauthorizedError)
                    ErrorService.catchAll(exception);
                else
                    AlertsService.addAlert({type:'error', message:exception.message});
            });
        };

        $scope.permalink = function() {

            // before run, use window location
            if (!$rootScope.reference) {
                return $window.location.href;
            }

            var url = context.mainURI;

            // add sort modifier
            if ($rootScope.reference.location.sort)
                url = url + $rootScope.reference.location.sort;

            // add paging modifier
            if ($rootScope.reference.location.paging)
                url = url + $rootScope.reference.location.paging;

            url = url + "?limit=" + pageInfo.pageLimit;

            return url;
        };

        $scope.before = function() {

            var previous = recordsetModel.page.previous;
            if (previous) {

                pageInfo.loading = true;

                // disable buttons while loading
                pageInfo.previousButtonDisabled = true;
                pageInfo.nextButtonDisabled = true;

                $rootScope.reference = previous;
                $log.info("Reference:", $rootScope.reference);

                $rootScope.reference.read(pageInfo.pageLimit).then(function getPage(page) {
                    $window.scrollTo(0, 0);

                    recordsetModel.page = page;
                    recordsetModel.rowValues = DataUtils.getRowValuesFromPage(page);

                    pageInfo.loading = false;
                    pageInfo.previousButtonDisabled = !page.hasPrevious;
                    pageInfo.nextButtonDisabled = !page.hasNext;

                    // update the address bar without adding to history stack
                    // page does not reload
                    $window.location.replace($scope.permalink());
                    $rootScope.location = $window.location.href;

                }, function error(response) {
                    $log.warn(response);

                    pageInfo.loading = false;
                    pageInfo.previousButtonDisabled = true;
                    pageInfo.nextButtonDisabled = true;

                    throw response;
                }).catch(function genericCatch(exception) {
                    if (exception instanceof ERMrest.UnauthorizedError)
                        ErrorService.catchAll(exception);
                    else
                        AlertsService.addAlert({type:'error', message:exception.message});
                });

            }
        };

        $scope.after = function() {

            var next = recordsetModel.page.next;
            if (next) {

                pageInfo.loading = true;

                // disable buttons while loading
                pageInfo.previousButtonDisabled = true;
                pageInfo.nextButtonDisabled = true;

                $rootScope.reference = next;
                $log.info("Reference:", $rootScope.reference);

                $rootScope.reference.read(pageInfo.pageLimit).then(function getPage(page) {
                    $window.scrollTo(0, 0);

                    recordsetModel.page = page;
                    recordsetModel.rowValues = DataUtils.getRowValuesFromPage(page);

                    pageInfo.loading = false;
                    pageInfo.previousButtonDisabled = !page.hasPrevious;
                    pageInfo.nextButtonDisabled = !page.hasNext;

                    // update the address bar
                    // page does not reload
                    $window.location.replace($scope.permalink());
                    $rootScope.location = $window.location.href;

                }, function error(response) {
                    $log.warn(response);

                    pageInfo.loading = false;
                    pageInfo.previousButtonDisabled = true;
                    pageInfo.nextButtonDisabled = true;

                    throw response;
                }).catch(function genericCatch(exception) {
                    if (exception instanceof ERMrest.UnauthorizedError)
                        ErrorService.catchAll(exception);
                    else
                        AlertsService.addAlert({type:'error', message:exception.message});
                });
            }

        };
    }])

    // Register work to be performed after loading all modules
    .run(['DataUtils', 'headInjector', '$window', 'pageInfo', 'context', 'recordsetModel', 'ERMrest', '$rootScope', 'Session', 'UriUtils', '$log', 'ErrorService', 'AlertsService', '$q',
        function(DataUtils, headInjector, $window, pageInfo, context, recordsetModel, ERMrest, $rootScope, Session, UriUtils, $log, ErrorService, AlertsService, $q) {

        try {
            headInjector.addTitle();
            headInjector.addCustomCSS();
            $rootScope.alerts = AlertsService.alerts;
            $rootScope.closeAlert = AlertsService.deleteAlert;

            UriUtils.setOrigin();

            // parse the URL
            var p_context = UriUtils.parseURLFragment($window.location);

            $rootScope.location = $window.location.href;
            pageInfo.loading = true;
            pageInfo.previousButtonDisabled = true;
            pageInfo.nextButtonDisabled = true;

            context.mainURI = p_context.mainURI;

            // only allowing single column sort here
            if (p_context.sort) {
                recordsetModel.sortby = p_context.sort[0].column;
                recordsetModel.sortOrder = (p_context.sort[0].descending ? "desc" : "asc");
            }

            context.catalogID = p_context.catalogID;
            context.schemaName = p_context.schemaName;
            context.tableName = p_context.tableName;

            var ermrestUri = UriUtils.chaiseURItoErmrestURI($window.location);

        } catch (error) {
            AlertsService.addAlert({type:'error', message:error.message});
        }


        ERMrest.resolve(ermrestUri, {cid: context.appName}).then(function getReference(reference) {
            $rootScope.reference = reference.contextualize.compact;
            $log.info("Reference:", $rootScope.reference);
            if (p_context.limit)
                pageInfo.pageLimit = p_context.limit;
            else if ($rootScope.reference.display.defaultPageSize)
                pageInfo.pageLimit = $rootScope.reference.display.defaultPageSize;
            else
                pageInfo.pageLimit = 25;
            recordsetModel.tableDisplayName = $rootScope.reference.displayname;
            recordsetModel.columns = $rootScope.reference.columns;

            return $rootScope.reference.read(pageInfo.pageLimit);
        }, function error(response) {
            return $q.reject(response);
        }).then(function getPage(page) {
            recordsetModel.page = page;
            recordsetModel.rowValues = DataUtils.getRowValuesFromPage(page);

            pageInfo.loading = false;
            pageInfo.previousButtonDisabled = !page.hasPrevious;
            pageInfo.nextButtonDisabled = !page.hasNext;
        }, function error(response) {
            throw response;
        }).catch(function genericCatch(exception) {
            $log.warn(exception);
            pageInfo.loading = false;
            pageInfo.previousButtonDisabled = true;
            pageInfo.nextButtonDisabled = true;
            if (exception instanceof ERMrest.UnauthorizedError)
                ErrorService.catchAll(exception);
            else
                AlertsService.addAlert({type:'error', message:exception.message});
        });

        /**
         * Whenever recordset updates the url (no reloading and no history stack),
         * it saves the location in $rootScope.location.
         * When address bar is changed, this code compares the address bar location
         * with the last save recordset location. If it's the same, the change of url was
         * done internally, do not refresh page. If not, the change was done manually
         * outside recordset, refresh page.
         */
        UriUtils.setLocationChangeHandling();
    }]);

/* end recordset */

})();
