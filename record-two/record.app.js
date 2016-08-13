(function() {
    'use strict';

    angular.module('chaise.record', [
        'ngSanitize',
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
            $rootScope.reference = reference.contextualize.record;

            $rootScope.relatedReferences = reference.related;

            // There should only ever be one entity related to this reference
            return $rootScope.reference.read(1);
        }).then(function getPage(page) {
            var tuple = page.tuples[0];

            // Used directly in the record-display directive
            $rootScope.recordDisplayname = tuple.displayname;
            $rootScope.recordValues = tuple.values;
            $rootScope.columns = $rootScope.reference.columns;

            $rootScope.dataArray = [];

            angular.forEach($rootScope.relatedReferences, function(ref){
                // We want to limit the number of values shown by default
                // Maybe have a chaise config option
                ref.read(5).then(function (page) {
                    $rootScope.dataArray.push(page.tuples);
                });
            });

        }, function error(response) {
            $log.warn(response);
            throw response;
        }).catch(function genericCatch(exception) {
            ErrorService.catchAll(exception);
        });
    }]);
})();
