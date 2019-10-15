(function() {
    'use strict';

    angular.module('chaise.utils.services', ['chaise.utils'])

    .service('logService', ['ConfigUtils', '$log', function (ConfigUtils, $log) {
        var context = ConfigUtils.getContextJSON();

        function logAction(action, path) {
            context.server.logHeaders({ action: action }, path).catch(function (err) {
                $log.debug("An error may have occured when logging: ", action);
                $log.debug(err);
            });
        }

        return {
            logAction: logAction
        }
    }]);

})();
