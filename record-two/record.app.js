(function() {
    'use strict';

    angular.module('chaise.record', [
        'chaise.errors',
        'chaise.utils',
        'ERMrest'
    ])

    // configure the context
    .config(['context', 'UriUtilsProvider', function configureContext(context, UriUtilsProvider) {
        var utils = UriUtilsProvider.$get();

        if (chaiseConfig.headTitle !== undefined) {
            document.getElementsByTagName('head')[0].getElementsByTagName('title')[0].innerHTML = chaiseConfig.headTitle;
        }
        
        utils.setOrigin();
        utils.parseURLFragment(window.location, context);
    }])

    .run(['context', 'ermrestServerFactory', 'recordModel', 'ErrorService', function runApp(context, ermrestServerFactory, recordModel, ErrorService) {
        try {
            var server = context.server = ermrestServerFactory.getServer(context.serviceURL);
        } catch (exception) {
            ErrorService.catchAll(exception);
        }
    }]);
})();
