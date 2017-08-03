
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
        'chaise.authen',
        'chaise.errors',
        'chaise.modal',
        'chaise.html',
        'chaise.footer',
        'chaise.record.table',
        'ui.bootstrap',
        'ngCookies',
        'ngSanitize'])

    .config(['$cookiesProvider', function($cookiesProvider) {
        $cookiesProvider.defaults.path = '/';
    }])

    // Register the 'context' object which can be accessed by config and other
    // services.
    .constant('context', {
        appName:'recordset',
        mainURI: null,  // the main URL portion up to filters (without modifiers)
        catalogID: null,
        tableName: null,
        chaiseBaseURL: null
    })

    // Configure all tooltips to be attached to the body by default. To attach a
    // tooltip on the element instead, set the `tooltip-append-to-body` attribute
    // to `false` on the element.
    .config(['$uibTooltipProvider', function($uibTooltipProvider) {
        $uibTooltipProvider.options({appendToBody: true});
    }])

    // Register the 'recordsetModel' object, which can be accessed by other
    // services, but cannot be access by providers (and config, apparently).
    .value('recordsetModel', {
        hasLoaded: false,
        reference: null,
        tableDisplayName: null,
        columns: [],
        sortby: null,       // column name, user selected or null
        sortOrder: null,    // asc (default) or desc
        enableAutoSearch: true,
        enableSort: true,   // allow sorting
        page: null,         // current page
        rowValues: [],      // array of rows values, each value has this structure {isHTML:boolean, value:value}
        search: null,       // search term
        pageLimit: 25,       // number of rows per page
        config: {}
    })

    // Register the recordset controller
    .controller('recordsetController', ['$scope', '$rootScope', 'context', '$window', 'recordsetModel', 'UriUtils', 'DataUtils', 'Session', '$log', 'ErrorService',  function($scope, $rootScope, context, $window, recordsetModel, UriUtils, DataUtils, Session, $log, ErrorService) {

        $scope.vm = recordsetModel;
        recordsetModel.RECORDEDIT_MAX_ROWS = 200;
        recordsetModel.selectedRows = [];
        $scope.navbarBrand = (chaiseConfig['navbarBrand'] !== undefined? chaiseConfig.navbarBrand : "");
        $scope.navbarBrandImage = (chaiseConfig['navbarBrandImage'] !== undefined? chaiseConfig.navbarBrandImage : "");
        $scope.navbarBrandText = (chaiseConfig['navbarBrandText'] !== undefined? chaiseConfig.navbarBrandText : "Chaise");

        // row data updated from directive
        // update permalink, address bar without reload
        $scope.$on('recordset-update', function() {
            $window.scrollTo(0, 0);
            $window.location.replace($scope.permalink());
            $rootScope.location = $window.location.href;
        });

        $scope.onSelect = function(tuple) {
            var rowIndex = recordsetModel.selectedRows.indexOf(tuple.displayname.value);

            // add the tuple to the list of selected rows
            if (rowIndex === -1) {
                recordsetModel.selectedRows.push(tuple.displayname.value);
            } else {
                recordsetModel.selectedRows.splice(rowIndex, 1);
            }

            recordsetModel.checkSelectedRows();
        };

        $scope.permalink = function() {

            // before run, use window location
            if (!recordsetModel.reference) {
                return $window.location.href;
            }

            //var url = context.mainURI;
            var url = context.chaiseBaseURL + "#" + UriUtils.fixedEncodeURIComponent(recordsetModel.reference.location.catalog) + "/" +
                recordsetModel.reference.location.compactPath;

            // add sort modifier
            if (recordsetModel.reference.location.sort)
                url = url + recordsetModel.reference.location.sort;

            // add paging modifier
            if (recordsetModel.reference.location.paging)
                url = url + recordsetModel.reference.location.paging;

            // add ermrestjs supported queryParams
            if (recordsetModel.reference.location.queryParamsString) {
                url = url + "?" + recordsetModel.reference.location.queryParamsString;
            }

            return url;
        };

        $scope.edit = function() {
            var link = recordsetModel.page.reference.contextualize.entryEdit.appLink;
            // TODO ermrestJS needs to handle the case when no limit is defined in the URL
            if (link.indexOf("?limit=") === -1 || link.indexOf("&limit=") === -1)
                link = link + (link.indexOf('?') === -1 ? "?limit=" : "&limit=" ) + recordsetModel.pageLimit;

            return link;
        };

        $scope.unfiltered = function () {
            return recordsetModel.reference.unfilteredReference.contextualize.compact.appLink;
        };

    }])

    // Register work to be performed after loading all modules
    .run(['AlertsService', 'context', 'DataUtils', 'ERMrest', 'ErrorService', 'headInjector', 'MathUtils', 'recordsetModel', 'Session', 'UiUtils', 'UriUtils', '$log', '$rootScope', '$window',
        function(AlertsService, context, DataUtils, ERMrest, ErrorService, headInjector, MathUtils, recordsetModel, Session, UiUtils, UriUtils, $log, $rootScope, $window) {

        try {
            var session;

            headInjector.setupHead();

            UriUtils.setOrigin();

            context.chaiseBaseURL = $window.location.href.replace($window.location.hash, '');
            var modifyEnabled = chaiseConfig.editRecord === false ? false : true;
            var deleteEnabled = chaiseConfig.deleteRecord === true ? true : false;
            if (true) {
                recordsetModel.config = {
                    viewable: false,
                    editable: false,
                    deletable: false,
                    selectMode: "multi-select"
                };
            } else {
                recordsetModel.config = {
                    viewable: true,
                    editable: modifyEnabled,
                    deletable: modifyEnabled && deleteEnabled,
                    selectMode: "no-select"
                };
            }

            $rootScope.alerts = AlertsService.alerts;

            $rootScope.location = $window.location.href;
            recordsetModel.hasLoaded = false;
            $rootScope.context = context;

            context.pageId = MathUtils.uuid();

            var ermrestUri = UriUtils.chaiseURItoErmrestURI($window.location);


            ERMrest.appLinkFn(UriUtils.appTagToURL);

            // Subscribe to on change event for session
            var subId = Session.subscribeOnChange(function() {

                // Unsubscribe onchange event to avoid this function getting called again
                Session.unsubscribeOnChange(subId);

                ERMrest.resolve(ermrestUri, {cid: context.appName, pid: context.pageId, wid: $window.name}).then(function getReference(reference) {
                    session = Session.getSessionValue();

                    var location = reference.location;

                    // only allowing single column sort here
                    if (reference.sortObject) {
                        recordsetModel.sortby = location.sortObject[0].column;
                        recordsetModel.sortOrder = (location.sortObject[0].descending ? "desc" : "asc");
                    }
                    context.catalogID = reference.table.schema.catalog.id;
                    context.tableName = reference.table.name;

                    recordsetModel.reference = reference.contextualize.compact;
                    recordsetModel.context = "compact";
                    recordsetModel.reference.session = session;

                    $log.info("Reference:", recordsetModel.reference);

                    if (location.queryParams.limit) {
                        recordsetModel.pageLimit = parseInt(location.queryParams.limit);
                    } else if (recordsetModel.reference.display.defaultPageSize) {
                        recordsetModel.pageLimit = recordsetModel.reference.display.defaultPageSize;
                    } else {
                        recordsetModel.pageLimit = 25;
                    }
                    recordsetModel.tableDisplayName = recordsetModel.reference.displayname;

                     // the additional provided name
                    if (location.queryParams && location.queryParams.subset) {
                        recordsetModel.subTitle = location.queryParams.subset;
                    }

                    recordsetModel.columns = recordsetModel.reference.columns;
                    recordsetModel.search = recordsetModel.reference.location.searchTerm;

                    return recordsetModel.reference.read(recordsetModel.pageLimit);
                }, function error(response) {
                    throw response;
                }).then(function getPage(page) {
                    recordsetModel.page = page;
                    recordsetModel.rowValues = DataUtils.getRowValuesFromPage(page);
                    recordsetModel.initialized = true;
                    recordsetModel.hasLoaded = true;

                    $rootScope.$broadcast('recordset-update');

                }, function error(response) {
                    throw response;
                }).catch(function genericCatch(exception) {
                    $log.warn(exception);
                    recordsetModel.hasLoaded = true;

                    throw exception;
                });

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


            // This is to allow the dropdown button to open at the top/bottom depending on the space available
            UiUtils.setBootstrapDropdownButtonBehavior();
        } catch (exception) {
            // pass to error handler
            throw exception;
        }
    }]);

/* end recordset */

})();
