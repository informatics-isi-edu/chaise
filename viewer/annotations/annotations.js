// A value to hold the rows of the annotation table
(function() {
    'use strict';

    angular.module('chaise.viewer')

    .value('annotations', [])

    .value('annotationList', [])

    .value('annotationCreateForm', {
        reference: null,
        columnModels: [],
        rows: [{}], // rows of data in the form, not the table from ERMrest
        oldRows: [{}], // Keep a copy of the initial rows data so that we can see if user has made any changes later
        submissionRows: [{}], // rows of data converted to raw data for submission
        foreignKeyData: [{}]
    })

    .value('annotationEditForm', {
        reference: null,
        columnModels: [],
        rows: [{}], // rows of data in the form, not the table from ERMrest
        oldRows: [{}], // Keep a copy of the initial rows data so that we can see if user has made any changes later
        submissionRows: [{}], // rows of data converted to raw data for submission
        foreignKeyData: [{}]
    });
})();
