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

        Session.getSession().then(function getSession(session) {
            UriUtils.setOrigin();
            return ermrestServerFactory.resolve($window.location);
        }).then(function getReference(reference) {
            $log.info(reference);

            if (reference.filter && reference.table) {
                $rootScope.table = reference.table;
                var recordPath = new ERMrest.DataPath(reference.table);
                var recordFilter = UriUtils.parsedFilterToERMrestFilter(reference.filter, reference.table);

                recordPath.filter(recordFilter).entity.get().then(function success(record) {
                    $log.info(record);
                    // So the data can be passed through the directive and watched for changes
                    $rootScope.record = record[0];
                }, function error(response) {
                    throw reponse;
                });
            }
        }, function error(response) {
            $log.warn(response);
        }).catch(function genericCatch(exception) {
            ErrorService.catchAll(exception);
        });
    }]);
})();
