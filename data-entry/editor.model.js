// A value to hold the columns from the designated table
(function() {
    'use strict';

    angular.module('chaise.dataEntry')

    .value('editorModel', {
        table: {},
        rows: [{}], // each row of fields in the form, not the table from ERMrest
        domainValues: {}
    });
})();
