(function(){
    'use strict';

    angular.module('chaise.viewer')
    .value('viewerModel', {
        table: {},
        rows: [], // rows of data in the form, not the table from ERMrest
        submissionRows: [], // rows of data converted to raw data for submission
        foreignKeyData: [], // the linkedData that we get from tuple object (data from outbound foreign keys)
        resultset: false,
    })
})();
