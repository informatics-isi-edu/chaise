// A value to hold the columns from the designated table
(function() {
    'use strict';

    angular.module('chaise.dataEntry')

    // Initialized with the table and name so that Angular won't complain when it
    // renders the initial view before the table data has arrived yet
    .value('data', {table:{name: '...'}});
})();
