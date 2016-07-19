(function() {
    'use strict';

    angular.module('chaise.record', [
        'chaise.errors',
        'chaise.modal',
        'chaise.navbar',
        'chaise.recordDisplay',
        'chaise.utils',
        'ERMrest',
        'ui.bootstrap'
    ])

    // Config is no
    .run(['ermrestServerFactory', 'UriUtils', 'ErrorService', '$log', '$rootScope', '$window', 'Session', function runApp(ermrestServerFactory, UriUtils, ErrorService, $log, $rootScope, $window, Session) {

        UriUtils.setOrigin();
        var ermrestUri = UriUtils.chaiseURItoErmrestURI($window.location);

        ermrestServerFactory.resolve(ermrestUri).then(function getReference(reference) {
            $log.info("Reference:", reference);

            if (reference.filter && reference.table) {
                $rootScope.table = reference.table;
                var recordPath = new ERMrest.DataPath(reference.table);
                var recordFilter = UriUtils.parsedFilterToERMrestFilter(reference.filter, reference.table);

                return recordPath.filter(recordFilter).entity.get();
            }
        }).then(function getRecord(record) {
            $log.info("Record:", record[0]);
            // So the data can be passed through the directive and watched for
            $rootScope.record = record[0];
        }, function error(response) {
            $log.warn(response);
            throw response;
        }).catch(function genericCatch(exception) {
            ErrorService.catchAll(exception);
        });
    }]);
})();
