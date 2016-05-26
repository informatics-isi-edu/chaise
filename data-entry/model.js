// A value to hold the columns from the designated table
(function() {
    'use strict';

    angular.module('chaise.dataEntry')

    .value('dataEntryModel', {
        table: {},
        rows: [{}], // rows of data in the form, not the table from ERMrest
        domainValues: {}
        // , filterUri: ''
    });
})();
