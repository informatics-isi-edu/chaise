(function() {
    'use strict';

    angular.module('chaise.record', [
        'chaise.utils',
        'ERMrest'
    ])

    //
    .config(['context', 'UriUtilsProvider', function configureContext(context. UriUtilsProvider) {
        var utils = UriUtilsProvider.$get();

        if (chaiseConfig.headTitle !== undefined) {
            document.getElementsByTagName('head')[0].getElementsByTagName('title')[0].innerHTML = chaiseConfig.headTitle;
        }

        utils.setOrigin();
        utils.parseURLFragment(window.location, context);
    }])

    .run(['context', 'ermrestServerFactory', 'recordModel', function runApp(context, ermrestServerFactory, recordModel) {
        try {
            var server = context.server = ermrestServerFactory.getServer(context.serviceURL);
        } catch (exception) {
            ErrorService.catchAll(exception);
        }
    }]);
})();
