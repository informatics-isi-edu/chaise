angular.module('ERMrest', [])

    .factory('ermrestServerFactory', ['$http', '$q', function($http, $q) {
        ERMrest.configure($http, $q);
        return ERMrest.ermrestFactory;
    }]);
