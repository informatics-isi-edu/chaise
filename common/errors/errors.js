(function() {
    'use strict';

    angular.module('chaise.errors', ['ui.bootstrap'])

    .factory('ErrorService', [function ErrorService() {

        function error409() {
            var modalInstance = $uibModal.open({
                templateUrl: 'errors/error.html',
                controller: 'ErrorController',
                controllerAs: 'ctrl',
                size: 'sm'
            });
        }

        return {
            error409: error409
        };
    }]);
})();
