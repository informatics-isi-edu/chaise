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

// The Chaise RecordSet module
angular.module('recordset', [
    'ermrestjs',
    'chaise.navbar',
    'chaise.utils',
    'chaise.authen',
    'chaise.errors',
    'chaise.modal',
        'ui.bootstrap'])

// Register the 'context' object which can be accessed by config and other
// services.
.constant('appName', 'recordset')

// Register the 'recordsetModel' object, which can be accessed by other
// services, but cannot be access by providers (and config, apparently).
.value('recordsetModel', {
    uri: null,        // uri without modifiers
    tableName: null,  // table name
    tableDisplayName: null,
    columns: [],      // [{name, displayname, hidden}, ...]
    sortby: null,     // column name, user selected or null
    sortOrder: null,  // asc (default) or desc
    tuples:null       // rows of data

})

.factory('pageInfo', [function() {
    return {
        loading: true,
        previousButtonDisabled: true,
        nextButtonDisabled: true,
        pageLimit: 10
    };

}])

// Register the recordset controller
.controller('recordsetController', ['$scope', '$rootScope', 'pageInfo', '$window', 'recordsetModel', 'UriUtils', 'Session', '$log', 'ErrorService',
    function($scope, $rootScope, pageInfo, $window, recordsetModel, UriUtils, Session, $log, ErrorService) {

    $scope.vm = recordsetModel;

    $scope.pageInfo = pageInfo;

    $scope.pageLimit = function(limit) {
        pageInfo.pageLimit = limit;
        $scope.sort();
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
            $scope.sort();
        }

    };

    $scope.toggleSortOrder = function () {
        recordsetModel.sortOrder = (recordsetModel.sortOrder === 'asc' ? recordsetModel.sortOrder = 'desc' : recordsetModel.sortOrder = 'asc');
        $scope.sort();
    };

    $scope.sort = function () {

        // get new reference with new sort
        if (recordsetModel.sortby)
            $rootScope.reference = $rootScope.reference.sort([{"column":recordsetModel.sortby, "descending":(recordsetModel.sortOrder === "desc")}]);

        pageInfo.previousButtonDisabled = true;
        pageInfo.nextButtonDisabled = true;
        pageInfo.loading = true;

        $rootScope.reference.read(pageInfo.pageLimit).then(function (page) {
            $window.scrollTo(0, 0);

            recordsetModel.page = page;
            recordsetModel.tuples = page.tuples;
            recordsetModel.rowValues = page.tuples.map(function (tuple, index, array) {
                return tuple.values;
            });

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
            ErrorService.catchAll(exception);
        });
    };


    $scope.permalink = function() {

        // before run, use window location
        if (!$rootScope.reference) {
            return $window.location.href;
        }

        var url = recordsetModel.fixedUri;

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

            $rootScope.reference = previous; // TODO contextualize for recordset
            $log.info("Reference:", $rootScope.reference);

            recordsetModel.columns = $rootScope.reference.columns.map(function (column, index, array) {
                return {"name": column.name, "displayname": column.displayname};
            });

            $rootScope.reference.read(pageInfo.pageLimit).then(function getPage(page) {
                $window.scrollTo(0, 0);

                recordsetModel.page = page;
                recordsetModel.tuples = page.tuples;
                recordsetModel.rowValues = page.tuples.map(function (tuple, index, array) {
                    return tuple.values;
                });

                pageInfo.loading = false;
                pageInfo.previousButtonDisabled = !page.hasPrevious;
                pageInfo.nextButtonDisabled = !page.hasNext;

                // update the address bar without adding to history staick
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
                ErrorService.catchAll(exception);
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

            $rootScope.reference = next; // TODO contextualize for recordset
            $log.info("Reference:", $rootScope.reference);

            recordsetModel.columns = $rootScope.reference.columns.map(function (column, index, array) {
                return {"name": column.name, "displayname": column.displayname};
            });

            $rootScope.reference.read(pageInfo.pageLimit).then(function getPage(page) {
                $window.scrollTo(0, 0);

                recordsetModel.page = page;
                recordsetModel.tuples = page.tuples;
                recordsetModel.rowValues = page.tuples.map(function (tuple, index, array) {
                    return tuple.values;
                });

                pageInfo.loading = false;
                pageInfo.previousButtonDisabled = !page.hasPrevious;
                pageInfo.nextButtonDisabled = !page.hasNext;

                // update the address bar
                // page does not reload
                location.replace($scope.permalink());
                $rootScope.location = $window.location.href;

            }, function error(response) {
                $log.warn(response);

                pageInfo.loading = false;
                pageInfo.previousButtonDisabled = true;
                pageInfo.nextButtonDisabled = true;

                throw response;
            }).catch(function genericCatch(exception) {
                ErrorService.catchAll(exception);
            });
        }

    };


    $scope.gotoRowLink = function(index) {
        var tuple = recordsetModel.tuples[index];
        var t_path = tuple.reference.location.compactPath;
        var path = $rootScope.chaiseURL + "/record/#" + UriUtils.fixedEncodeURIComponent(recordsetModel.catalogID) + "/" + t_path;

        location.assign(path);
    }


}])

// Register work to be performed after loading all modules
.run(['$window', 'pageInfo', 'appName', 'recordsetModel', 'ERMrest', '$rootScope', 'Session', 'UriUtils', '$log', 'ErrorService',
    function($window, pageInfo, appName, recordsetModel, ERMrest, $rootScope, Session, UriUtils, $log, ErrorService) {

    try {

        UriUtils.setOrigin();
        $rootScope.chaiseURL = $window.location.href.replace($window.location.hash, '');
        $rootScope.chaiseURL = $rootScope.chaiseURL.replace("/recordset/", '');

        // parse the URL
        var context = UriUtils.parseURLFragment($window.location);

        $rootScope.location = $window.location.href;
        $rootScope.errorMessage='';

        pageInfo.loading = true;
        if (context.limit)
            pageInfo.pageLimit = context.limit;
        else
            pageInfo.pageLimit = 10;
        pageInfo.previousButtonDisabled = true;
        pageInfo.nextButtonDisabled = true;

        recordsetModel.fixedUri = context.fixedUri;

        // only allowing single column sort here
        if (context.sort) {
            recordsetModel.sortby = context.sort[0].column;
            recordsetModel.sortOrder = (context.sort[0].descending ? "desc" : "asc");
        }

        recordsetModel.catalogID = context.catalogID;
        recordsetModel.schemaName = context.schemaName;
        recordsetModel.tableName = context.tableName;


    } catch (error) {
        $rootScope.errorMessage = error.message;
    }

    var ermrestUri = UriUtils.chaiseURItoErmrestURI($window.location);
    ERMrest.resolve(ermrestUri, {cid: appName}).then(function getReference(reference) {
        $rootScope.reference = reference; // TODO contextualize for recordset
        $log.info("Reference:", $rootScope.reference);

        recordsetModel.tableDisplayName = reference.displayname;
        recordsetModel.columns = reference.columns.map(function(column, index, array) {
           return {"name": column.name, "displayname": column.displayname};
        });

        return $rootScope.reference.read(pageInfo.pageLimit);
    }).then(function getPage(page) {
        recordsetModel.page = page;
        recordsetModel.tuples = page.tuples;
        recordsetModel.rowValues = page.tuples.map(function(tuple, index, array) {
            return tuple.values;
        });

        pageInfo.loading = false;
        pageInfo.previousButtonDisabled = !page.hasPrevious;
        pageInfo.nextButtonDisabled = !page.hasNext;
    }, function error(response) {
        $log.warn(response);

        pageInfo.loading = false;
        pageInfo.previousButtonDisabled = true;
        pageInfo.nextButtonDisabled = true;

        throw response;
    }).catch(function genericCatch(exception) {
        ErrorService.catchAll(exception);
    });


}])

/* end recordset */;
