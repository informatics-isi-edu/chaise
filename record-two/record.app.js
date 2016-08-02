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
            recordEnd: this.pageLimit
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

            return reference.read(1);
        }).then(function getPage(page) {
            var tuple = page.tuples[0];

            // Used directly in the record-display directive
            $rootScope.recordValues = tuple.values;
            $rootScope.columns = $rootScope.reference.columns;

        }, function error(response) {
            $log.warn(response);
            throw response;
        }).catch(function genericCatch(exception) {
            ErrorService.catchAll(exception);
        });
    }]);
})();
