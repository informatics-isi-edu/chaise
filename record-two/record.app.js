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
    .run(['ermrestServerFactory', 'UriUtils', 'ErrorService', '$log', '$rootScope', '$window', function runApp(ermrestServerFactory, UriUtils, ErrorService, $log, $rootScope, $window) {

        UriUtils.setOrigin();

        ermrestServerFactory.resolve($window.location).then(function success(reference) {
            console.log(reference);

            if (reference.filter) {
                var recordPath = new ERMrest.DataPath(reference.table);
                var recordFilter = UriUtils.parsedFilterToERMrestFilter(reference.filter, reference.table);

                recordPath.filter(recordFilter).entity.get().then(function success(record) {
                    console.log(record);
                    // So the data can be passed through the directive and watched for changes
                    $rootScope.record = record[0];
                }, function error(response) {
                    throw reponse;
                });
            }
        }, function error() {

        }).catch(function genericCatch(exception) {
            ErrorService.catchAll(exception);
        });
    }]);
})();
