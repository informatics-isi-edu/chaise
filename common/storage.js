(function() {
    'use strict';

    angular.module('chaise.storage', [])

    .factory('StorageService', ['$window', function StorageService($window) {
        var localStorage = $window.localStorage;

        /**
         * Deletes the data in local storage defined under `storageLocation`
         *
         * @param {String} storageLocation - name of object data is stored under
         */
        var deleteStorage = function (storageLocation) {
            localStorage.removeItem(storageLocation);
        };

        /**
         * Stores data in local storage under `storageLocation`
         *
         * @param {String} storageLocation - name of object data is stored under
         * @param {Object} data - data to be stored
         */
        var setStorage = function (storageLocation, data) {
            localStorage.setItem(storageLocation, angular.toJson(data));
        };

        /**
         * Gets the data in local storage defined under `storageLocation`
         *
         * @param {String} storageLocation - name of object data is stored under
         */
        var getStorage = function (storageLocation) {
            var value = localStorage.getItem(storageLocation);
            return value ? JSON.parse(value) : null;
        };

        /**
         * Updates the data in local storage under `storageLocation`
         *
         * @param {Object} data - data to be updated
         * @param {String} storageLocation - name of object data is stored under
         */
        var updateStorage = function (storageLocation, data) {
            var storedData = getStorage(storageLocation) || {};

            Object.keys(data).forEach(function (key) {
                storedData[key] = data[key];
            });

            setStorage(storageLocation, storedData);
        };

        return {
            deleteStorage: deleteStorage,
            getStorage: getStorage,
            setStorage: setStorage,
            updateStorage: updateStorage
        };
    }])
})();
