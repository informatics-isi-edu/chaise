// A value to hold the columns from the designated table
(function() {
    'use strict';

    angular.module('chaise.dataEntry')

    .value('table', {
        name: '...',
        foreignKeys: [],
        keys: [],
        nativeColumns: [],
        entity: {}
    });
})();
