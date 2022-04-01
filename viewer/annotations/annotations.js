// A value to hold the rows of the annotation table
(function() {
    'use strict';

    angular.module('chaise.viewer')

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
     *  - canUpdate
     *  - canDelete
     */
    .value('annotationModels', [])

    // NOTE: if we change the recordedit vm model object, we should update this one as well.
    .value('annotationCreateForm', {
        logStack: null,
        logStackPath: null,
        submissionButtonDisabled: false, //used in recordCreate to signal whether we're sending data or not
        reference: null,
        columnModels: [],
        rows: [{}], // rows of data in the form, not the table from ERMrest
        canUpdateRows: [{}],
        oldRows: [{}], // Keep a copy of the initial rows data so that we can see if user has made any changes later
        submissionRows: [{}], // rows of data converted to raw data for submission
        foreignKeyData: [{}],
    })

    // NOTE: if we change the recordedit vm model object, we should update this one as well.
    .value('annotationEditForm', {
        logStack: null,
        logStackPath: null,
        submissionButtonDisabled: false, //used in recordCreate to signal whether we're sending data or not
        reference: null,
        columnModels: [],
        rows: [{}], // rows of data in the form, not the table from ERMrest
        canUpdateRows: [{}],
        oldRows: [{}], // Keep a copy of the initial rows data so that we can see if user has made any changes later
        submissionRows: [{}], // rows of data converted to raw data for submission
        foreignKeyData: [{}]
    });
  })();
