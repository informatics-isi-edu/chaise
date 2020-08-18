// A value to hold the rows of the annotation table
(function() {
    'use strict';

    angular.module('chaise.viewer')
    
    // TODO not used
    .value('annotations', [])

    /**
     * TODO should be a prototype
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
    
    // NOTE: if we change the recordedit vm model object, we should update this one as well.
    .value('annotationCreateForm', {
        reference: null,
        columnModels: [],
        rows: [{}], // rows of data in the form, not the table from ERMrest
        oldRows: [{}], // Keep a copy of the initial rows data so that we can see if user has made any changes later
        submissionRows: [{}], // rows of data converted to raw data for submission
        foreignKeyData: [{}]
    })

    // NOTE: if we change the recordedit vm model object, we should update this one as well.
    .value('annotationEditForm', {
        reference: null,
        columnModels: [],
        rows: [{}], // rows of data in the form, not the table from ERMrest
        oldRows: [{}], // Keep a copy of the initial rows data so that we can see if user has made any changes later
        submissionRows: [{}], // rows of data converted to raw data for submission
        foreignKeyData: [{}]
    });
})();
