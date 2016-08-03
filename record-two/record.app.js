(function() {
    'use strict';

    angular.module('chaise.record', [
        'chaise.errors',
        'chaise.modal',
        'chaise.navbar',
        'chaise.record.display',
        'chaise.record.table',
        'chaise.utils',
        'ermrestjs',
        'ui.bootstrap'
    ])

    // The page info object passed to the table directive
    .factory('pageInfo', [function() {
        return {
            loading: true,
            previousButtonDisabled: true,
            nextButtonDisabled: true,
            pageLimit: 5,
            recordStart: 1,
            recordEnd: 5
        };
    }])

    .run(['ERMrest', 'UriUtils', 'ErrorService', 'pageInfo', '$log', '$rootScope', '$window', function runApp(ERMrest, UriUtils, ErrorService, pageInfo, $log, $rootScope, $window) {
        $rootScope.pageInfo = pageInfo;
        UriUtils.setOrigin();

        // The context object won't change unless the app is reloaded
        var context = $rootScope.context = UriUtils.parseURLFragment($window.location);
        context.appName = 'record-two';

        var ermrestUri = UriUtils.chaiseURItoErmrestURI($window.location);

        ERMrest.resolve(ermrestUri, {cid: context.appName}).then(function getReference(reference) {
            $log.info("Reference:", reference);
            $rootScope.reference = reference;
            var recordReference = reference.contextualize.record;

            $rootScope.relatedReferences = reference.related;

            return reference.read(1);
        }).then(function getPage(page) {
            var tuple = page.tuples[0];

            // Used directly in the record-display directive
            $rootScope.recordValues = tuple.values;
            $rootScope.columns = $rootScope.reference.columns;

            //TODO: remove this after related works. faked data for showing the related table
            // // ==================================================
            // var data1 = [];
            // var recordValues = $rootScope.recordValues;
            // $rootScope.relatedReferences = [];
            //
            // data1.push(recordValues);
            //
            // // table with 1 row
            // var tempObj = {
            //     displayname: "Related Table",
            //     columns: $rootScope.columns,
            //     data: data1
            // }
            //
            // var data2 = [];
            // data2.push(recordValues);
            //
            // var newValues = angular.copy(recordValues);
            // newValues[0] = "36";
            // data2.push(newValues);
            //
            // newValues = angular.copy(recordValues);
            // newValues[0] = "9007";
            // data2.push(newValues);
            //
            // newValues = angular.copy(recordValues);
            // newValues[0] = "9002";
            // data2.push(newValues);
            //
            // // table with 4 rows
            // var tempObj2 = {
            //     displayname: "Related Table2",
            //     columns: $rootScope.columns,
            //     data: data2
            // }
            //
            // $rootScope.relatedReferences.push(tempObj2);
            // $rootScope.relatedReferences.push(tempObj);
            // ==================================================

        }, function error(response) {
            $log.warn(response);
            throw response;
        }).catch(function genericCatch(exception) {
            ErrorService.catchAll(exception);
        });
    }]);
})();
