// A value to hold the columns from the designated table
(function() {
    'use strict';

    angular.module('chaise.recordEdit')

    .value('recordEditModel', {
        table: {},
        rows: [{}], // rows of data in the form, not the table from ERMrest
        oldRows: [{}], // Keep a copy of the initial rows data so that we can see if user has made any changes later
        submissionRows: [{}], // rows of data converted to raw data for submission
        foreignKeyData: [{}] // the linkedData that we get from tuple object (data from outbound foreign keys)
    });
})();
