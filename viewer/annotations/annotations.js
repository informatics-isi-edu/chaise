// A value to hold the rows of the annotation table
(function() {
    'use strict';

    angular.module('chaise.viewer')

    .value('annotations', [])

    /**
     * each annotation has the following:
     *  - svgID
     *  - groupID
     *  - anatomy
     *  - description
     *  - isSelected
     *  - isDrawing
     *  - isDisplay
     *  - isNew
     *  - isStoredInDB
     *  - name
     *  - id
     *  - url
     *  - tuple
     */
    .value('annotationModels', [])

    .value('annotationCreateForm', {
        returnEditContext: true,
        reference: null,
        columnModels: [],
        rows: [{}], // rows of data in the form, not the table from ERMrest
        oldRows: [{}], // Keep a copy of the initial rows data so that we can see if user has made any changes later
        submissionRows: [{}], // rows of data converted to raw data for submission
        foreignKeyData: [{}]
    })

    .value('annotationEditForm', {
        returnEditContext: true,
        reference: null,
        columnModels: [],
        rows: [{}], // rows of data in the form, not the table from ERMrest
        oldRows: [{}], // Keep a copy of the initial rows data so that we can see if user has made any changes later
        submissionRows: [{}], // rows of data converted to raw data for submission
        foreignKeyData: [{}]
    });
})();
