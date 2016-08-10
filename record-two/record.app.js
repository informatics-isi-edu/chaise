(function() {
    'use strict';

    angular.module('chaise.record', [
        'ngSanitize',
        'chaise.errors',
        'chaise.modal',
        'chaise.navbar',
        'chaise.recordDisplay',
        'chaise.utils',
        'ermrestjs',
        'ui.bootstrap'
    ])

    .run(['ERMrest', 'UriUtils', 'ErrorService', '$log', '$rootScope', '$window', function runApp(ERMrest, UriUtils, ErrorService, $log, $rootScope, $window) {

        UriUtils.setOrigin();

        // The context object won't change unless the app is reloaded
        var context = $rootScope.context = UriUtils.parseURLFragment($window.location);
        context.appName = 'record-two';

        var ermrestUri = UriUtils.chaiseURItoErmrestURI($window.location);

        ERMrest.resolve(ermrestUri, {cid: context.appName}).then(function getReference(reference) {
            $log.info("Reference:", reference);
            $rootScope.reference = reference = reference.contextualize.record;
            return reference.read(1);
        }).then(function getPage(page) {
            var tuple = page.tuples[0];
            $rootScope.displayname = tuple.displayname;
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
