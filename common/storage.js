(function() {
    'use strict';

    angular.module('chaise.storage', [])

    .factory('StorageService', ['messageMap', '$log', '$window', function StorageService(messageMap, $log, $window) {
        var localStorageNotAvailable = false, localStorage;

        // a simple test to ensure localStorage is available
        // (in some cases localStorage might be null)
        try {
            var test = "test";
            localStorage = $window.localStorage;
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
        } catch (e) {
            $log.warn(messageMap.localStorageDisabled);
            localStorageNotAvailable = true;
        }


        /**
         * Deletes all the data in local storage defined under `storageLocation`
         *
         * @param {String} storageLocation - name of object data is stored under
         */
        var deleteStorageNamespace = function (storageLocation) {
            if (localStorageNotAvailable) return;

            localStorage.removeItem(storageLocation);
        };

        /**
         * Deletes the data in local storage defined under `storageLocation` with `keyName`
         *
         * @param {String} storageLocation - name of object data is stored under
         * @param {String} keyName - key name of the data to be deleted
         */
        var deleteStorageValue = function (storageLocation, keyName) {
            if (localStorageNotAvailable) return;

            var value = getStorage(storageLocation);

            delete value[keyName];
            setStorage(storageLocation, value);
        };

        /**
         * Stores data in local storage under `storageLocation`
         *
         * @param {String} storageLocation - name of object data is stored under
         * @param {Object} data - data to be stored
         */
        var setStorage = function (storageLocation, data) {
            if (localStorageNotAvailable) return;

            localStorage.setItem(storageLocation, angular.toJson(data));
        };

        /**
         * Gets the data in local storage defined under `storageLocation`
         *
         * @param {String} storageLocation - name of object data is stored under
         */
        var getStorage = function (storageLocation) {
            if (localStorageNotAvailable) return null;

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
            if (localStorageNotAvailable) return;

            var storedData = getStorage(storageLocation) || {};

            Object.keys(data).forEach(function (key) {
                storedData[key] = data[key];
            });

            setStorage(storageLocation, storedData);
        };

        return {
            isAvailable: (localStorageNotAvailable === false),
            deleteStorageNamespace: deleteStorageNamespace,
            deleteStorageValue: deleteStorageValue,
            getStorage: getStorage,
            setStorage: setStorage,
            updateStorage: updateStorage
        };
    }])
})();
